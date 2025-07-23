// seed.js
import mongoose from "mongoose";
import fetch from "node-fetch";
import { faker } from "@faker-js/faker/locale/en";
import User from "./models/User.js";
import Article from "./models/Article.js";
import Comment from "./models/Comment.js";

import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const NUM_USERS = 470;
const NUM_AUTHORS = 200;
const NUM_ARTICLES = 5060;
const COMMENTS_PER_ARTICLE = 3;
const CATEGORIES = [
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

const ARTICLES_PER_CATEGORY = Math.floor(NUM_ARTICLES / CATEGORIES.length);

async function fetchPmcIds(term, retmax = 10) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(
    term
  )}&retmax=${retmax}&retmode=json`;
  const res = await fetch(url);
  const json = await res.json();
  return json.esearchresult.idlist || [];
}

async function fetchPmcArticleDetails(id) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${id}&retmode=json`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.result || !json.result[id]) return null;
  return json.result[id];
}

function generateArticleContent(title, abstract) {
  // Generate ~4 paragraphs of realistic English text for the content
  const paragraphs = faker.lorem.paragraphs(4, "\n\n");

  return {
    time: Date.now(),
    version: "2.31.0-rc.7",
    blocks: [
      {
        id: faker.string.uuid(),
        type: "header",
        data: {
          text: title,
          level: 2,
        },
      },
      {
        id: faker.string.uuid(),
        type: "paragraph",
        data: {
          text: abstract || faker.lorem.paragraph(),
        },
      },
      ...paragraphs.split("\n\n").map((para) => ({
        id: faker.string.uuid(),
        type: "paragraph",
        data: { text: para },
      })),
      {
        id: faker.string.uuid(),
        type: "quote",
        data: {
          text: faker.lorem.sentences(2),
          caption: faker.person.fullName(),
          alignment: "left",
        },
      },
    ],
  };
}
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Article.deleteMany(),
    Comment.deleteMany(),
  ]);

  // 1. Create users
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const role = i < NUM_AUTHORS ? "writer" : "user";
    users.push(
      new User({
        username: faker.internet.userName(),
        email: faker.internet.email().toLowerCase(),
        password: "pwdpwdpwd123", // replace with hashed in prod
        name: faker.person.fullName(),
        role,
        bio:
          role === "writer" ? faker.lorem.sentences(2) : faker.lorem.sentence(),
        avatar: faker.image.avatar(),
        title:
          role === "writer"
            ? faker.helpers.arrayElement([
                "MD",
                "PhD",
                "Research Scientist",
                "Professor",
                "Clinical Researcher",
                "Medical Doctor",
              ])
            : "",
      })
    );
  }
  await User.insertMany(users);
  console.log(`Created ${users.length} users.`);

  const authors = users.filter((u) => u.role === "writer");
  const nonAuthors = users.filter((u) => u.role !== "writer");

  // 2. Fetch and create articles
  const articles = [];
  for (const category of CATEGORIES) {
    console.log(`Fetching articles for category: ${category}`);
    const pmcIds = await fetchPmcIds(
      `${category} AND clinical trial`,
      ARTICLES_PER_CATEGORY
    );
    if (pmcIds.length === 0) {
      console.warn(`No articles found for category: ${category}`);
      continue;
    }

    for (const pmcId of pmcIds) {
      const data = await fetchPmcArticleDetails(pmcId);
      if (!data) continue;

      // Sometimes the title or abstract might be missing
      const title = data.title || faker.lorem.sentence();
      const description =
        data.summary || data.excerpt || faker.lorem.sentences(2);
      const author = faker.helpers.arrayElement(authors);

      articles.push(
        new Article({
          title,
          description,
          content: generateArticleContent(title, description),
          author: author._id,
          status: "published",
          category,
          tags: faker.lorem
            .words(faker.number.int({ min: 3, max: 6 }))
            .split(" "),
          coverImage: `https://picsum.photos/seed/${pmcId}/800/400`, // placeholder image with pmcId seed
          views: faker.number.int({ min: 100, max: 10000 }),
          likes: faker.number.int({ min: 0, max: 500 }),
          likedBy: [],
          comments: [],
        })
      );

      if (articles.length >= NUM_ARTICLES) break;
    }
    if (articles.length >= NUM_ARTICLES) break;
  }

  const insertedArticles = await Article.insertMany(articles);
  console.log(`Inserted ${insertedArticles.length} articles.`);

  // 3. Create comments for each article
  const comments = [];
  for (const article of insertedArticles) {
    for (let i = 0; i < COMMENTS_PER_ARTICLE; i++) {
      const user = faker.helpers.arrayElement(nonAuthors);
      const comment = new Comment({
        content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
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
  console.log(`Inserted ${comments.length} comments.`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
  console.log("✅ Database seeded with realistic medical research data!");
}

seed().catch((err) => {
  console.error(err);
  mongoose.disconnect();
});
