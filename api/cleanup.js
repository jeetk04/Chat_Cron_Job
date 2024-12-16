const { MongoClient } = require('mongodb');

// Use the environment variable for the MongoDB URI
const uri = process.env.MONGODB_URI;

const dbName = 'test';
const usersCollection = 'users';
const chatsCollection = 'chats';
const connectionsCollection = 'connections';

async function deleteExpiredUsers() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    console.log("Connecting to database...");
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(usersCollection);
    const chats = db.collection(chatsCollection);
    const connections = db.collection(connectionsCollection);
    const currentTime = new Date();

    // Find expired users
    const expiredUsers = await users.find({
      createdAt: { $lt: new Date(currentTime - 5 * 60 * 1000) }
    }).toArray();

    console.log(`Found ${expiredUsers.length} expired users.`);

    for (const user of expiredUsers) {
      console.log(`Removing expired user: ${user.username} (ID: ${user._id})`);

      // Delete user-specific chats (both sent and received)
      const chatDeleteResult = await chats.deleteMany({
        $or: [{ senderId: user._id }, { receiverId: user._id }]
      });
      console.log(`Deleted ${chatDeleteResult.deletedCount} chats for user: ${user.username}`);

      // Delete user-specific connections (both outgoing and incoming)
      const connectionDeleteResult = await connections.deleteMany({
        $or: [{ userId: user._id }, { connectionId: user._id }]
      });
      console.log(`Deleted ${connectionDeleteResult.deletedCount} connections for user: ${user.username}`);

      // Delete the user
      const userDeleteResult = await users.deleteOne({ _id: user._id });
      console.log(`Deleted user ${user.username}: ${userDeleteResult.deletedCount}`);
    }

    console.log("Expired user cleanup completed.");
  } catch (err) {
    console.error('Error deleting expired users:', err);
    throw err; // Rethrow the error to trigger a 500 response
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

module.exports = async (req, res) => {
  try {
    console.log("Cleanup function triggered");
    await deleteExpiredUsers();
    res.status(200).send('Cleanup completed.');
  } catch (err) {
    console.error('Error during API execution:', err);
    res.status(500).send('Error during cleanup.');
  }
};
