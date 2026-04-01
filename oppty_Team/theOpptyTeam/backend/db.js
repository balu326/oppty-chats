import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("oppty-chats");
    console.log("✅ DB Connected");
  }
  return db;
}
