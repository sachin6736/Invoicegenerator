

import { setServers } from 'node:dns/promises';

setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import invoiceroutes from "./routes/invoiceroutes.js";
import paypalroutes from "./routes/paypalroutes.js"
import authRoutes from "./routes/authroutes.js";
import paypalAccountRoutes from './routes/paypalAccountroutes.js';

connectDB();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
}));

console.log(`PayPal Mode: ${process.env.PAYPAL_MODE || 'sandbox (default)'}`);

app.use(express.json());

app.use('/auth',authRoutes);
app.use('/Invoice', invoiceroutes);
app.use('/Payment', paypalroutes);
app.use('/settings', paypalAccountRoutes );

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 