import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : undefined,
});

db.on("error", (error) => {
  console.error("Unexpected PostgreSQL connection error:", error.message);
});

export default db;
