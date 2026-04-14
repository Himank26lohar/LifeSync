/**
 * Purpose:
 * Boot the Node backend by connecting to MongoDB first and then starting Express.
 * This is the single entry point you run with `node src/server.js`.
 */
const app = require("./app");
const { port } = require("./config/env");
const { connectDatabase } = require("./db/mongo");

async function start() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`LifeSync backend listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
