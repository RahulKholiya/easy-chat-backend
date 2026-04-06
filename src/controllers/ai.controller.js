import { model } from "../lib/gemini.js";

export const aiController = async (req, res) => {
try {
const { prompt } = req.body;

```
if (!prompt) {
  return res.status(400).json({ answer: "No prompt provided" });
}

const result = await model.generateContent(prompt);
const response = await result.response;

res.status(200).json({
  answer: response.text(),
});
```

} catch (error) {
console.log("AI ERROR:", error.message);

```
res.status(500).json({
  answer: "⚠️ AI is currently unavailable",
});
```

}
};
