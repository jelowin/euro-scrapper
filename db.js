import dotenv from 'dotenv';
dotenv.config();

import { createClient } from "@libsql/client";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// CREATE TABLE coins (
//   id UUID PRIMARY KEY,
//   country TEXT NOT NULL,
//   description TEXT NOT NULL,
//   imageSrc TEXT,
//   reason TEXT,
//   year INT,
//   UNIQUE (country, description)
// );

// CREATE TABLE users (
//   email TEXT NOT NULL,
//   coinId UUID NOT NULL,
//   UNIQUE (email, coinId),
//   FOREIGN KEY (coinId) REFERENCES coins (id) ON DELETE CASCADE
// );

export default turso
