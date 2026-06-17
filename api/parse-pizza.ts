// Vercel serverless function — POST /api/parse-pizza
// Parses a natural-language pizza request into a structured config via Gemini.
// Falls back to a sensible mock when GEMINI_API_KEY is not configured.

import { GoogleGenAI } from '@google/genai';

const systemInstruction = `
You are a pizza ordering AI that extracts the user's desired pizza configuration into a JSON snippet.
The output MUST be a valid JSON object matching this schema exactly:
{
  "size": "Small" | "Medium" | "Large" | "Extra Large",
  "crust": "Hand Tossed" | "Handmade Pan" | "Crunchy Thin Crust" | "Brooklyn Style" | "New York Style" | "Parmesan Stuffed Crust" | "Gluten Free Crust",
  "sauce": "Robust Inspired Tomato Sauce" | "Hearty Marinara" | "Garlic Parmesan White Sauce" | "Alfredo Sauce" | "BBQ Sauce" | "Ranch Sauce" | "Buffalo Sauce" | "No Sauce",
  "cheese": string[],
  "meats": string[],
  "veggies": string[],
  "extras": string[],
  "quantity": number
}

If the user does not specify a field explicitly, use standard defaults:
- size: "Large"
- crust: "Hand Tossed"
- sauce: "Robust Inspired Tomato Sauce"
- cheese: ["Mozzarella"]
- meats: []
- veggies: []
- extras: []
- quantity: 1

Return ONLY JSON, no markdown formatting.
`;

const MOCK = {
  size: 'Large', crust: 'Hand Tossed', sauce: 'Robust Inspired Tomato Sauce',
  cheese: ['Mozzarella'], meats: ['Pepperoni'], veggies: [], extras: [], quantity: 1,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = req.body?.query;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // No key configured — return the mock so the UI still works.
    return res.status(200).json(MOCK);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: { systemInstruction, temperature: 0.1 },
    });

    const outputText = response.text || '';
    const clean = outputText.replace(/^```json/g, '').replace(/```$/g, '').trim();
    try {
      return res.status(200).json(JSON.parse(clean));
    } catch {
      return res.status(200).json(MOCK);
    }
  } catch (error: any) {
    // Graceful fallback on rate limits / outages so search never hard-fails.
    if (error?.status === 503 || error?.status === 'UNAVAILABLE' || String(error?.message).includes('503')) {
      return res.status(200).json(MOCK);
    }
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
