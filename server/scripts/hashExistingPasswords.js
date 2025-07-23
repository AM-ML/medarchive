const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Function to hash a password
const hashPassword = async (plainTextPassword) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainTextPassword, salt);
};

// Update existing users
const updatePasswords = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    // Counter for updated users
    let updatedCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Check if the password is already hashed (approximately)
        // Bcrypt hashes typically start with '$2a$', '$2b$', or '$2y$'
        if (user.password && !user.password.startsWith('$2')) {
          const plainTextPassword = user.password;
          user.password = await hashPassword(plainTextPassword);
          await user.save();
          updatedCount++;
          console.log(`Updated user: ${user.username}`);
        } else {
          console.log(`Skipped user ${user.username} - password already hashed`);
        }
      } catch (userError) {
        console.error(`Error updating user ${user.username}:`, userError);
      }
    }

    console.log(`Updated passwords for ${updatedCount} users`);
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

// Run the update function
updatePasswords(); 