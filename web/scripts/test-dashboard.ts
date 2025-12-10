import 'dotenv/config'; // MUST be the first import to ensure env vars are loaded before other imports
import { dashboardController } from '../src/controllers/trafficController';

async function main() {
  console.log("Starting Dashboard Controller Test...");
  console.log("DATABASE_URL Loaded:", process.env.DATABASE_URL ? "YES" : "NO");
  
  try {
    console.time("dashboardController");
    const data = await dashboardController.getDashboardData();
    console.timeEnd("dashboardController");

    // console.time("dashboardController2");
    // const data2 = await dashboardController.getDashboardData2();
    // console.timeEnd("dashboardController2");

    console.log("Test Successful!");

    console.log("------------------------------------------------------");

    console.log("Data retrieved:", JSON.stringify(data, null, 2));
    console.log("Data length:", data.length);

    
    console.log("------------------------------------------------------");

    // console.log("Data retrieved:", JSON.stringify(data2, null, 2));
    // console.log("Data length:", data2.length);

  } catch (error) {
    console.error("Test Failed:", error);
  } 
}

main();