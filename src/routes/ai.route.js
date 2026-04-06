import express from "express";
import { model } from "../lib/gemini.js";

const router = express.Router(); // ✅ define FIRST

router.post("/", async (req, res) => {
try {
const { prompt } = req.body;

```
if (!prompt) {
  return res.status(400).json({ message: "Prompt required" });
}

const isDetailed =
  prompt.toLowerCase().includes("explain") ||
  prompt.toLowerCase().includes("detail") ||
  prompt.toLowerCase().includes("more");

const systemPrompt = `
```

You are EMO, a smart AI assistant.

${
isDetailed
? `

* Give a clear detailed answer
* Use short paragraphs
  `  :`
* Reply in 1-2 lines only
* Keep it simple and conversational
  `
  }

User: ${prompt}
`;

```
const result = await model.generateContent(systemPrompt);
const response = await result.response;

const text = response.text();

res.status(200).json({ answer: text });
```

} catch (error) {
console.log("AI ERROR:", error.message);

```
// 🔥 fallback response
return res.status(200).json({
  answer: "⚡ I'm a bit busy right now, try again in a moment!",
});
```

}
});

export default router;
