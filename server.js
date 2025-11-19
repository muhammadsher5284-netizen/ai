import express from "express";
import dotenv from "dotenv";
import geminiRoutes from "./routes/geminiRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => res.send("Gemini Backend Server is running 🚀"));

// Gemini routes
app.use("/api/gemini", geminiRoutes);

// Start server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
