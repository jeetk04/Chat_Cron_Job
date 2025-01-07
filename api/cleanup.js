const { MongoClient, ObjectId } = require('mongodb');

// Use the environment variable for the MongoDB URI
const uri = process.env.MONGODB_URI;

const dbName = 'test';
const usersCollection = 'users';
const chatsCollection = 'conversations';

async function deleteExpiredUsers() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    console.log("Connecting to database...");
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(usersCollection);
    const chats = db.collection(chatsCollection);

    const currentTime = new Date();
    // const twentyFourHoursAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);
    const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

    // Step 1: Find expired users
    const expiredUsers = await users
      .find({ createdAt: { $lt: twentyFourHoursAgo } })
      .toArray();

    console.log(`Found ${expiredUsers.length} expired users.`);

    // Step 2: Store expired user IDs in an array
    const expiredUserIds = expiredUsers.map((user) => user._id);

    if (expiredUserIds.length === 0) {
      console.log("No expired users found. Cleanup not needed.");
      return;
    }

    // Step 3: Delete expired users from the users collection
    const deleteUsersResult = await users.deleteMany({ _id: { $in: expiredUserIds } });
    console.log(`Deleted ${deleteUsersResult.deletedCount} expired users.`);

    // Step 4: Update remaining users' connections to remove expired user IDs
    const updateConnectionsResult = await users.updateMany(
      { "connections.connectionId": { $in: expiredUserIds } },
      { $pull: { connections: { connectionId: { $in: expiredUserIds } } } }
    );
    console.log(`Updated ${updateConnectionsResult.modifiedCount} users' connections.`);

    // Step 5: Delete conversations where user1 or user2 matches expired user IDs
    const deleteConversationsResult = await chats.deleteMany({
      $or: [{ user1: { $in: expiredUserIds } }, { user2: { $in: expiredUserIds } }],
    });
    console.log(`Deleted ${deleteConversationsResult.deletedCount} conversations.`);

    console.log("Expired user cleanup completed.");
  } catch (err) {
    console.error("Error deleting expired users:", err);
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
    res.status(200).send("Cleanup completed.");
  } catch (err) {
    console.error("Error during API execution:", err);
    res.status(500).send("Error during cleanup.");
  }
};
