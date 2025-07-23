# Migration Scripts

This directory contains database migration scripts for the InQuill application.

## Password Hashing Script

The `hashExistingPasswords.js` script updates any existing user accounts with plain text passwords by hashing them using bcrypt. This is important for security and should be run if there are any users with unhashed passwords in the database.

### How to Run

To run the password hashing migration:

1. Make sure your environment variables are set up correctly (particularly `MONGODB_URI`)
2. Navigate to the server directory
3. Run the script using Node.js:

```bash
node scripts/hashExistingPasswords.js
```

### What the Script Does

- Connects to your MongoDB database
- Finds all user accounts
- Checks each user's password to determine if it's already hashed
- If the password is not hashed (doesn't start with '$2', which is the bcrypt prefix), it will:
  - Hash the plain text password using bcrypt
  - Save the updated user with the hashed password
- Skips users whose passwords are already hashed
- Provides a summary of how many users were updated

### When to Run

Run this script:

1. After fixing the password hashing in the User model
2. If you suspect there are users with unhashed passwords in the database
3. After any bulk imports of user data that might have plain text passwords

### Security Note

This is a one-time migration script. Once all passwords are properly hashed, you should not need to run this again under normal circumstances. 