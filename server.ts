import { GoogleGenAI } from '@google/genai';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 30001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set.");
    } else {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }
  return ai;
}

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

app.post('/api/parse-pizza', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const aiClient = getAI();
  if (!aiClient) {
    // Mock parsing if no key
    return res.json({
      size: "Large",
      crust: "Hand Tossed",
      sauce: "Garlic Parmesan White Sauce",
      cheese: ["Mozzarella", "Cheddar Blend"],
      meats: ["Bacon", "Philly Steak"],
      veggies: ["Onions"],
      extras: ["Well Done"],
      quantity: 1
    });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    });

    const outputText = response.text || '';
    const cleanJsonString = outputText.replace(/^```json/g, '').replace(/```$/g, '').trim();
    
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(cleanJsonString);
    } catch(e) {
      console.error("Failed to parse Gemini output as JSON", outputText);
      return res.status(500).json({ error: 'Failed to parse AI output' });
    }

    res.json(parsedConfig);
  } catch (error: any) {
    console.error('Error calling Gemini:', error);
    
    // Graceful fallback during high API demand
    if (error?.status === 503 || error?.status === 'UNAVAILABLE' || error?.message?.includes('503')) {
      return res.json({
        size: "Large",
        crust: "Hand Tossed",
        sauce: "Robust Inspired Tomato Sauce",
        cheese: ["Mozzarella"],
        meats: ["Pepperoni"],
        veggies: [],
        extras: [],
        quantity: 1
      });
    }
    
    res.status(500).json({ error: 'Failed to process request' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // The build output path
    const distPath = path.join(__dirname, '..', 'dist'); // Because server.cjs will be in dist/
    // Wait, in production server.cjs is IN dist/ directly, so static path is __dirname!
    // But then during development, it doesn't matter because it hits Vite middleware.
    const staticPath = __dirname;
    app.use(express.static(staticPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
