require("dotenv").config();

const { createApp } = require("./app");
const { connectMongo } = require("./config/mongo");
const { startBirthdayCron } = require("./cronJobs");


const PORT = process.env.PORT;

async function main() {
  // Connect DB first so health can reflect real status
  await connectMongo();

  const app = createApp();
  app.listen(PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`bill-app-backend running on http://192.168.1.207:${PORT}`);
     startBirthdayCron(); // ← ye line add karo
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
