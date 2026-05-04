import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
  var mongoClientConnection: Promise<MongoClient> | undefined;
}

export async function connectToDatabase() {
  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(env.mongodbUri, {
      bufferCommands: false,
    });
  }

  return global.mongooseConnection;
}

export async function getMongoClient() {
  if (!global.mongoClientConnection) {
    const client = new MongoClient(env.mongodbUri);
    global.mongoClientConnection = client.connect();
  }

  return global.mongoClientConnection;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db();
}
