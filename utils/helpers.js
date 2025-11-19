export function safeJSONParse(text) {
    try {
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch {
        return { status: "error", message: "AI response was not valid JSON.", raw: text };
    }
}
