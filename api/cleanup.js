const { MongoClient } = require('mongodb');

// Use the environment variable for the MongoDB URI
const uri = process.env.MONGODB_URI;

const dbName = 'test';
const collectionName = 'users';

async function deleteExpiredUsers() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    console.log("Connecting to database...");
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const currentTime = new Date();

    // Log current time for debugging
    console.log("Current Time:", currentTime);

    // Delete users older than 2 minutes
    const result = await collection.deleteMany({
      createdAt: { $lt: new Date(currentTime - 2 * 60 * 1000) },
    });

    console.log(`Deleted ${result.deletedCount} expired users.`);
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