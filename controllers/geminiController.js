import { callWithRetry } from "../services/geminiService.js";

export const handleGeminiPrompt = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ status: "error", message: "Missing 'prompt' in request body." });
    }

    try {
        const result = await callWithRetry(prompt);
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "error", message: "Server error", details: err.message });
    }
};
