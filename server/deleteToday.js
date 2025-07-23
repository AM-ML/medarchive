require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Article = require("./models/Article");
const Comment = require("./models/Comment");

const MONGODB_URI = process.env.MONGODB_URI;

const deleteTodayEntries = async () => {
  await mongoose.connect(MONGODB_URI);

  // Define start and end of June 5, 2025 in UTC
  const startOfDay = new Date(Date.UTC(2025, 5, 5, 0, 0, 0)); // June is month 5 (0-based index)
  const endOfDay = new Date(Date.UTC(2025, 5, 5, 23, 59, 59, 999));

  const deleteConditions = { createdAt: { $gte: startOfDay, $lte: endOfDay } };

  const [deletedUsers, deletedArticles, deletedComments] = await Promise.all([
    User.deleteMany(deleteConditions),
    Article.deleteMany(deleteConditions),
    Comment.deleteMany(deleteConditions),
  ]);

  console.log(`🧹 Deleted ${deletedUsers.deletedCount} users`);
  console.log(`🧹 Deleted ${deletedArticles.deletedCount} articles`);
  console.log(`🧹 Deleted ${deletedComments.deletedCount} comments`);

  mongoose.disconnect();
};

deleteTodayEntries();
