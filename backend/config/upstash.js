import { Client } from "@upstash/workflow";
import { QSTASH_TOKEN, QSTASH_URL } from "./env.js";

/**
 * Upstash Workflow Client
 * Used to trigger and manage durable workflows (e.g., subscription reminders).
 */
const workflowClient = new Client({
  token: QSTASH_TOKEN,
  ...(QSTASH_URL && { baseUrl: QSTASH_URL }),
});

export default workflowClient;
