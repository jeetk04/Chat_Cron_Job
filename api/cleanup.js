const { MongoClient } = require('mongodb');

// Use the environment variable for the MongoDB URI
const uri = process.env.MONGODB_URI;

const dbName = 'test';
const usersCollection = 'user1';

async function deleteExpiredUsers() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    console.log("Connecting to database...");
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(usersCollection);
    const currentTime = new Date();

    // Find users whose account duration has expired
    const expiredUsers = await users.find({
      accountDuration: { $exists: true }, // Ensure accountDuration exists
      createdAt: { $exists: true }, // Ensure createdAt exists
      $expr: {
        $lt: [
          {
            $divide: [
              { $subtract: [currentTime, "$createdAt"] },
              1000 * 60 // Convert milliseconds to minutes
            ]
          },
          "$accountDuration"
        ]
      }
    }).toArray();

    if (expiredUsers.length > 0) {
      console.log(`Found ${expiredUsers.length} expired users. Deleting...`);
      const result = await users.deleteMany({
        _id: { $in: expiredUsers.map(user => user._id) }
      });
      console.log(`Deleted ${result.deletedCount} expired users.`);
    } else {
      console.log("No expired users found.");
    }
  } catch (error) {
    console.error("Error deleting expired users:", error);
  } finally {
    await client.close();
  }
}

// Run the function
deleteExpiredUsers();