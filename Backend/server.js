// ────────────────────────────────────────────────
// MUST BE THE VERY FIRST LINES – BEFORE dotenv or ANY imports
import { setServers } from 'node:dns/promises';

setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

// Now safe to load dotenv and everything else
import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import invoiceroutes from "./routes/invoiceroutes.js";

// Connect to MongoDB
connectDB();

const app = express();

// ====================== CORS CONFIGURATION (Best Version) ======================
app.use(cors({
  origin: [
    "https://www.autopartsinvoices.xyz",
    "https://autopartsinvoices.xyz",
    "https://invoicegenerator-six-khaki.vercel.app",   // old Vercel domain
    "http://localhost:5173",                           // Vite dev
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));



// ====================== OTHER MIDDLEWARE ======================
app.use(express.json());

// ====================== ROUTES ======================
app.use('/Invoice', invoiceroutes);

// ====================== SERVER ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});