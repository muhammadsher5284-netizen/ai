import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .env file.");
    process.exit(1);
}

// Helper: clean & safe JSON parse (removes accidental markdown)
function safeJSONParse(text) {
    try {
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch {
        return {
            status: "error",
            message: "AI response was not valid JSON. Raw response returned.",
            raw: text
        };
    }
}

// Helper: build combined context safely
function buildContextBlock(items = []) {
    if (!Array.isArray(items)) {
        console.warn("⚠️ buildContextBlock received non-array, converting to empty array");
        items = [];
    }

    return items
        .map(it => `[type:${it.type}] [id:${it.id}] [created_at:${it.created_at}] ${it.text}`)
        .join("\n\n");
}

// MAIN GEMINI CALL
async function callGemini(prompt) {
    const todayDate = new Date().toISOString().split("T")[0];

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const userMessage = `

You are going to behave like a friendly, polite, cheerful girl. Always respond in a kind, positive, and supportive tone.

INPUT LANGUAGE HANDLING:
1. If the user writes in Roman Urdu, always respond in **Hindi**.
2. If the user writes in English, respond in **English**.
3. Detect the language automatically and mention it in the JSON object as "language": "en-US" or "hi-IN".

STRICT RULES:
1. Always respond in **JSON format ONLY**, no explanations, no extra text.
2. The JSON must have the following structure:

[
  {
    "aires": "AI returned response in the correct language",
    "language": "en-US | hi-IN"
  }
]

3. Always be friendly, supportive, and cheerful.
4. Never produce abusive, harmful, or inappropriate content.
5. If the user asks anything inappropriate or offensive, politely refuse by responding in JSON like this:

[
  {
    "aires": "I'm sorry, I cannot do that.",
    "language": "en-US | hi-IN"
  }
]

6. Always maintain the friendly, respectful tone, no matter what the user asks.
7. All responses must strictly follow this JSON format, no exceptions.


6. Always maintain the friendly, respectful tone, no matter what the user asks.
7. All responses must strictly follow this JSON format, no exceptions.


USER PROMPT:
${prompt}
`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: userMessage }]
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        let textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return {
                status: "error",
                message: "No valid response from Gemini.",
                raw: data
            };
        }

        return safeJSONParse(textResponse);

    } catch (err) {
        return {
            status: "error",
            message: "Gemini API network or fetch error.",
            details: err.message
        };
    }
}

// Retry wrapper
async function callWithRetry(prompt) {
    const retries = 3
    const delay = 2000
    for (let i = 0; i < retries; i++) {
        const res = await callGemini(prompt);
        if (res?.status === "success" || i === retries - 1) return res;

        console.log(`⚠️ Retry ${i + 1} failed: ${res.message}`);
        await new Promise(r => setTimeout(r, delay));
    }
}

// =====================
// EXPRESS ROUTES
// =====================

// Simple health check
app.get("/", (req, res) => res.send("Gemini Backend Server is running 🚀"));

// Endpoint to call Gemini
app.post("/api/gemini", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ status: "error", message: "Missing 'prompt' in request body." });
    }

    const result = await callWithRetry(prompt);
    res.json(result);
});

// Start server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
