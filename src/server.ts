import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth";
import foodRoutes from "./routes/foods";
import { run } from "./db";
import supportRoutes from './routes/support'; // Add this



const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(express.json());



// Serve static frontend from /public
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// Optional: if you want "/" to always return index.html
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use('/api', supportRoutes); // Add this line

// Background job: delete expired foods every 10 minutes
function startExpiryCleanupJob() {
  setInterval(async () => {
    const nowIso = new Date().toISOString();
    try {
      await run(
        "DELETE FROM foods WHERE datetime(expiry) <= datetime(?)",
        [nowIso]
      );
      console.log("Expired foods cleaned at", new Date().toISOString());
    } catch (e) {
      console.error("Error cleaning expired foods", e);
    }
  }, 10 * 60 * 1000); // 10 minutes
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startExpiryCleanupJob();
});
