import fetch from "node-fetch";
import { safeJSONParse } from "../utils/helpers.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .env file.");
    process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
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

USER PROMPT:
${prompt}
`;

    const body = {
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) return { status: "error", message: "No valid response from Gemini.", raw: data };

        return safeJSONParse(textResponse);

    } catch (err) {
        return { status: "error", message: "Gemini API network or fetch error.", details: err.message };
    }
}

// Retry logic
export async function callWithRetry(prompt) {
    const retries = 3;
    const delay = 2000;

    for (let i = 0; i < retries; i++) {
        const res = await callGemini(prompt);
        if (res?.status !== "error" || i === retries - 1) return res;

        console.log(`⚠️ Retry ${i + 1} failed: ${res.message}`);
        await new Promise(r => setTimeout(r, delay));
    }
}
