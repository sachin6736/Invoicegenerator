

// import { setServers } from 'node:dns/promises';

// setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

// import dotenv from 'dotenv';
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import invoiceroutes from "./routes/invoiceroutes.js";
// import paypalroutes from "./routes/paypalroutes.js"
// import authRoutes from "./routes/authroutes.js";
// import paypalAccountRoutes from './routes/paypalAccountroutes.js';

// connectDB();

// const app = express();

// const allowedOrigins = (process.env.FRONTEND_URLS || "")
//   .split(",")
//   .map(o => o.trim())
//   .filter(Boolean);

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error(`Not allowed by CORS: ${origin}`));
//     }
//   },
//   credentials: true
// }));

// console.log(`PayPal Mode: ${process.env.PAYPAL_MODE || 'sandbox (default)'}`);

// app.use(express.json());

// app.use('/auth',authRoutes);
// app.use('/Invoice', invoiceroutes);
// app.use('/Payment', paypalroutes);
// app.use('/settings', paypalAccountRoutes );

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// }); 

// server.js  (Updated CORS)
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();

import connectDB from "./config/db.js";
import invoiceroutes from "./routes/invoiceroutes.js";
import paypalroutes from "./routes/paypalroutes.js";
import authRoutes from "./routes/authroutes.js";
import paypalAccountRoutes from './routes/paypalAccountroutes.js';

connectDB();

const app = express();

// ✅ Improved CORS Configuration
const allowedOrigins = [
  "https://www.autopartsinvoices.xyz",
  "https://autopartsinvoices.xyz",
  "https://www.autopartsinvoice.xyz",     // second domain
  "https://autopartsinvoice.xyz",
  "http://localhost:5173",                // for local development
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ Blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,           // Important if using cookies/auth
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/Invoice', invoiceroutes);
app.use('/Payment', paypalroutes);
app.use('/settings', paypalAccountRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Allowed Origins:`, allowedOrigins);
});