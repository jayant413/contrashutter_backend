import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ENDPOINT_URL = process.env.CRON_ENDPOINT_URL;

if (!ENDPOINT_URL) {
  console.error(
    "Error: CRON_ENDPOINT_URL is not defined in environment variables"
  );
  process.exit(1);
}

/**
 * Cron job that calls the specified endpoint every 10 minutes
 */
const scheduleEndpointCall = () => {
  console.log(`Setting up cron job to call ${ENDPOINT_URL} every 10 minutes`);

  // Run every 10 minutes (0, 10, 20, 30, 40, 50 minutes of each hour)
  const cronExpression = "*/10 * * * *";

  cron.schedule(cronExpression, async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Calling endpoint: ${ENDPOINT_URL}`
      );
      const response = await axios.get(ENDPOINT_URL);
      console.log(
        `[${new Date().toISOString()}] Endpoint call successful, status: ${
          response.status
        }`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error calling endpoint:`,
        error
      );
    }
  });
};

export default scheduleEndpointCall;
