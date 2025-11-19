import express from "express";
import { handleGeminiPrompt } from "../controllers/geminiController.js";

const router = express.Router();

router.post("/", handleGeminiPrompt);

export default router;
