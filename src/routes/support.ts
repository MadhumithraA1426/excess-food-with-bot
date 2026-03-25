import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const router = Router();

router.post('/support', async (req, res) => {
  const { message } = req.body;
  if (!genAI) {
    return res.json({
      reply:
        "🤖 Support bot is not configured (missing GEMINI_API_KEY). Please try again later.",
    });
  }
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  
  const prompt = `You are Excess Food Management support bot. Help with:
- Login/register issues
- Donor: How to list food, expiry rules  
- User: Finding donations, contacting donors
- App features, bugs, feedback

App context: Node+TS+SQLite, 2 roles (donor/user), auto-delete expired food.

User: ${message}
Reply helpfully, max 2 sentences, use emojis.`;

  try {
    const result = await model.generateContent(prompt);
    res.json({ reply: await result.response.text() });
  } catch (error: any) {
    console.error("Chatbot Error:", error);
    res.json({ reply: "🤖 Error connecting to AI: " + (error.message || "Unknown error") });
  }
});

export default router;
