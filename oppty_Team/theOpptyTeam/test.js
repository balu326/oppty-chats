import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://reddybalaji326_db_user:Oppty123@cluster0.cdf0s9c.mongodb.net/oppty-chats?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.log("❌ Error:", err);
  }
}

run();