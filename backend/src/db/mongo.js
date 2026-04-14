/**
 * Purpose:
 * Own the MongoDB client connection and provide named collection handles used by services.
 * This keeps database setup in one place and makes the rest of the code read like business logic.
 */
const { MongoClient } = require("mongodb");
const {
  mongoUrl,
  databaseName,
  mongoTlsAllowInvalidCerts,
  mongoTlsAllowInvalidHostnames,
} = require("../config/env");
const { httpError } = require("../utils/http");

if (!mongoUrl) throw new Error("MONGODB_URL is required");

const client = new MongoClient(mongoUrl, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  tlsAllowInvalidCertificates: mongoTlsAllowInvalidCerts,
  tlsAllowInvalidHostnames: mongoTlsAllowInvalidHostnames,
});

let database;

async function connectDatabase() {
  if (!database) {
    await client.connect();
    database = client.db(databaseName);
  }
  return database;
}

function getDb() {
  if (!database) throw httpError(503, "Database unavailable. Check MongoDB connection and Atlas network access.");
  return database;
}

function getCollections() {
  const db = getDb();
  return {
    db,
    tasks: db.collection("tasks"),
    habits: db.collection("habits"),
    wellness: db.collection("wellness"),
    journal: db.collection("journal"),
    profile: db.collection("profile"),
    users: db.collection("users"),
    focusSessions: db.collection("focus_sessions"),
    timeBlocks: db.collection("time_blocks"),
  };
}

module.exports = { connectDatabase, getDb, getCollections };
