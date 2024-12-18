import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({path: "./.env.dev.local"});
if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not defined");
}
console.log(`POSTGRES_URL is: ${process.env.POSTGRES_URL}`);

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./lib/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
