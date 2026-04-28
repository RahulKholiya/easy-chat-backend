import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import aiRoutes from "./routes/ai.route.js";




dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
// app.use(cors({
//   origin: true,   // 🔥 allow all frontend URLs
//   credentials: true,
// }));
const allowedOrigins = [
  "http://localhost:5173",
  "https://easy-chat-frontend-iimfk37t1-rahulkholiyas-projects.vercel.app",
  "https://easy-chat-frontend-theta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow temporarily
    }
  },
  credentials: true,
}));

app.options("*", cors()); // 🔥 VERY IMPORTANT

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

server.listen(PORT, () => {
  console.log("Server running on PORT:", PORT);
  connectDB();
});