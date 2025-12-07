import 'dotenv/config'; // MUST be the first import to ensure env vars are loaded before other imports
import { dashboardController } from '../src/controllers/dashboardController';

async function main() {
  console.time("dashboardController");
  console.log("Starting Dashboard Controller Test...");
  console.log("DATABASE_URL Loaded:", process.env.DATABASE_URL ? "YES" : "NO");

  try {
    const data = await dashboardController.getDashboardData2();
    console.log("Test Successful!");
    console.log("Data retrieved:", JSON.stringify(data, null, 2));
    console.log("Data length:", data.length);
  } catch (error) {
    console.error("Test Failed:", error);
  } finally {
    console.timeEnd("dashboardController");
  }
}

main();