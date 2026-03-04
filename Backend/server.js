// ────────────────────────────────────────────────
// MUST BE THE VERY FIRST LINES – BEFORE dotenv or ANY imports that might trigger MongoDB
import { setServers } from 'node:dns/promises';

setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
// Cloudflare first (fast/reliable), Google as backup

// Now safe to load dotenv and everything else
import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import invoiceroutes from "./routes/invoiceroutes.js";

// Now call connectDB() – DNS is already forced
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/Invoice', invoiceroutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});