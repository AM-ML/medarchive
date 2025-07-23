import mongoose from "mongoose";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import { XMLParser } from "fast-xml-parser";

import User from "./models/User.js";
import Article from "./models/Article.js";
import Comment from "./models/Comment.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Medical categories for diversification
const MED_CATEGORIES = [
  "Neurology",
  "Cardiology",
  "Pulmonology",
  "Genetics",
  "Infectious Disease",
  "Immunology",
  "Rheumatology",
  "Endocrinology",
  "Oncology",
  "Pediatrics",
  "Psychiatry",
  "Hematology",
  "Internal Medicine",
  "Nephrology",
  "Transplant Medicine",
  "Gastroenterology",
  "Dermatology",
  "Obstetrics & Gynecology",
  "Surgery",
  "Ophthalmology",
  "Otolaryngology",
  "Dentistry",
  "Orthopedics",
  "Public Health",
  "Medical Technology",
];

// Helper: fetch PMC article IDs for a given query
async function fetchPMCArticleIDs(query, retmax = 10) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(
    query
  )}&retmax=${retmax}&retmode=json`;

  const res = await fetch(url);
  const json = await res.json();
  return json.esearchresult.idlist || [];
}

// Helper: fetch article details (metadata + abstract) by PMC IDs
async function fetchPMCArticlesDetails(idList) {
  if (idList.length === 0) return [];

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${idList.join(
    ","
  )}&retmode=xml`;

  const res = await fetch(url);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const data = parser.parse(xml);

  // The XML root is <pmc-articleset>, containing multiple <article> elements
  let articles = [];
  if (data["pmc-articleset"] && data["pmc-articleset"].article) {
    articles = Array.isArray(data["pmc-articleset"].article)
      ? data["pmc-articleset"].article
      : [data["pmc-articleset"].article];
  }

  return articles;
}

// Extract title, abstract, authors, body text from PMC article XML node
function parsePMCArticle(article) {
  try {
    const front = article.front || {};
    const articleMeta = front["article-meta"] || {};

    // Title
    let title = "";
    if (
      articleMeta["title-group"] &&
      articleMeta["title-group"]["article-title"]
    ) {
      title = articleMeta["title-group"]["article-title"];
      if (typeof title === "object" && title["#text"]) {
        title = title["#text"];
      }
    }

    // Abstract (combine all <abstract> paragraphs)
    let abstractText = "";
    if (articleMeta.abstract) {
      const abs = articleMeta.abstract;
      if (Array.isArray(abs)) {
        abstractText = abs
          .map((a) =>
            typeof a === "string"
              ? a
              : a["p"]
              ? Array.isArray(a["p"])
                ? a["p"].join("\n")
                : a["p"]
              : ""
          )
          .join("\n\n");
      } else if (typeof abs === "object" && abs["p"]) {
        abstractText = Array.isArray(abs["p"]) ? abs["p"].join("\n") : abs["p"];
      } else if (typeof abs === "string") {
        abstractText = abs;
      }
    }

    // Authors (names only)
    let authors = [];
    if (articleMeta["contrib-group"] && articleMeta["contrib-group"].contrib) {
      const contribs = Array.isArray(articleMeta["contrib-group"].contrib)
        ? articleMeta["contrib-group"].contrib
        : [articleMeta["contrib-group"].contrib];

      authors = contribs
        .filter((c) => c["name"])
        .map((c) => {
          const name = c["name"];
          return `${name["given-names"] || ""} ${name["surname"] || ""}`.trim();
        });
    }

    // Use abstract as main content paragraph blocks
    const content = {
      time: Date.now(),
      version: "1.0",
      blocks: [
        {
          id: faker.string.uuid(),
          type: "header",
          data: { text: title, level: 2 },
        },
        ...abstractText
          .split("\n\n")
          .filter((p) => p.trim())
          .map((p) => ({
            id: faker.string.uuid(),
            type: "paragraph",
            data: { text: p.trim() },
          })),
        {
          id: faker.string.uuid(),
          type: "quote",
          data: {
            text:
              authors.length > 0
                ? `Study conducted by ${authors.join(", ")}`
                : "Research article",
            caption: authors.length > 0 ? authors[0] : "Unknown",
            alignment: "left",
          },
        },
      ],
    };

    return {
      title: title || "Untitled Article",
      description: abstractText.slice(0, 200),
      content,
      authors,
    };
  } catch (error) {
    console.error("Error parsing PMC article", error);
    return null;
  }
}

async function seedDatabase() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clean existing data
  await Promise.all([
    User.deleteMany(),
    Article.deleteMany(),
    Comment.deleteMany(),
  ]);
  console.log("Cleared existing data");

  // 1. Create users
  const users = [];
  for (let i = 0; i < 60; i++) {
    const role = i < 15 ? (i < 3 ? "admin" : "writer") : "user";
    const name = faker.person.fullName();
    users.push(
      new User({
        username: faker.internet.userName(name).toLowerCase(),
        email: faker.internet.email(name).toLowerCase(),
        password: "pwdpwdpwd123",
        name,
        bio:
          role !== "user"
            ? faker.lorem.sentence()
            : "Medical research enthusiast and reader.",
        avatar: faker.image.avatar(),
        role,
        title:
          role === "writer"
            ? faker.name.jobTitle()
            : role === "admin"
            ? "Administrator"
            : "",
      })
    );
  }
  await User.insertMany(users);
  console.log("Created 60 users");

  const writers = users.filter(
    (u) => u.role === "writer" || u.role === "admin"
  );
  const regularUsers = users.filter((u) => u.role === "user");

  // 2. For each medical category, fetch articles, parse, and insert
  let allArticles = [];
  for (const category of MED_CATEGORIES) {
    const query = `open access[filter] AND "${category}"[MeSH Terms] AND clinical trial[filter]`;
    console.log(`Fetching articles for category: ${category}`);

    try {
      const pmcIDs = await fetchPMCArticleIDs(query, 5); // Fetch 5 per category to limit seed time
      const rawArticles = await fetchPMCArticlesDetails(pmcIDs);

      for (const art of rawArticles) {
        const parsed = parsePMCArticle(art);
        if (!parsed) continue;

        // Assign random writer as author
        const author = faker.helpers.arrayElement(writers);

        // Add random tags related to category & general medical terms
        const tags = [
          category.toLowerCase().replace(/\s/g, ""),
          "clinicaltrial",
          faker.lorem.word(),
          faker.lorem.word(),
        ];

        // Random healthcare-related cover image (unblurred)
        const coverImage = `https://loremflickr.com/640/360/healthcare,medicine,${Math.floor(
          Math.random() * 1000
        )}`;

        const articleDoc = new Article({
          title: parsed.title,
          description: parsed.description,
          content: parsed.content,
          author: author._id,
          status: "published",
          category,
          tags,
          coverImage,
          views: faker.number.int({ min: 10, max: 200 }),
          likes: faker.number.int({ min: 0, max: 50 }),
          likedBy: [],
          comments: [],
        });

        allArticles.push(articleDoc);
      }
      console.log(
        `Fetched ${pubmedIds.length} article IDs for category: ${category}`
      );

      for (const id of pubmedIds) {
        const detailsResponse = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${id}&retmode=xml`
        );
        const detailsXml = await detailsResponse.text();
        const detailsJson = parser.parse(detailsXml);

        // Print out the JSON keys or some content to check
        console.log(`Article ID: ${id}`);
        console.log(JSON.stringify(detailsJson, null, 2)); // or just key paths

        // Your existing extraction logic here
      }
    } catch (err) {
      console.error(
        `Failed to fetch/parse articles for category ${category}:`,
        err
      );
    }
  }

  // Insert all articles
  const insertedArticles = await Article.insertMany(allArticles);
  console.log(`Inserted ${insertedArticles.length} articles`);

  // 3. Create comments (5 per article)
  const comments = [];
  for (const article of insertedArticles) {
    for (let i = 0; i < 5; i++) {
      const user = faker.helpers.arrayElement(regularUsers);
      const comment = new Comment({
        content: faker.lorem.sentences(2),
        author: user._id,
        article: article._id,
        likes: faker.number.int({ min: 0, max: 20 }),
        replies: [],
        parentComment: null,
      });
      comments.push(comment);
      article.comments.push(comment._id);
    }
    await article.save();
  }

  await Comment.insertMany(comments);
  console.log(`Inserted ${comments.length} comments`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
  console.log("✅ Database seeded with realistic medical research data!");
}

seedDatabase().catch((e) => {
  console.error(e);
  mongoose.disconnect();
});
