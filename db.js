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
//   id UUID PRIMARY KEY,
//   email TEXT NOT NULL UNIQUE
// );

// CREATE TABLE user_coins (
//   user_id UUID NOT NULL,
//   coin_id UUID NOT NULL,
//   PRIMARY KEY (user_id, coin_id),
//   FOREIGN KEY (user_id) REFERENCES users (id),
//   FOREIGN KEY (coin_id) REFERENCES coins (id)
// );

export default turso
