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

app.post('/api/ocr-menu', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 parameter' });
  }

  const aiClient = getAI();
  if (!aiClient) {
    console.warn("GEMINI_API_KEY is not set. Falling back to mock OCR.");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return res.json([
      { name: 'Large Pepperoni Pizza', price: 16.99, category: 'Pizza', description: '8 slices, classic pepperoni' },
      { name: 'Medium Cheese Pizza', price: 12.99, category: 'Pizza', description: '6 slices, mozzarella blend' },
      { name: 'Small BBQ Chicken Pizza', price: 10.99, category: 'Pizza', description: '4 slices, BBQ sauce base' },
      { name: 'Garlic Bread', price: 4.99, category: 'Sides', description: 'Toasted with garlic butter' },
      { name: 'Chicken Wings (8pc)', price: 11.99, category: 'Sides', description: 'Choice of sauce' },
      { name: 'Coca-Cola (2L)', price: 3.49, category: 'Drinks', description: 'Chilled bottle' },
      { name: 'Pepsi (2L)', price: 3.49, category: 'Drinks', description: 'Chilled bottle' },
      { name: 'Chocolate Fudge Brownie', price: 3.99, category: 'Desserts', description: 'Warm fudge brownie' }
    ]);
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: `You are an expert OCR and menu parsing assistant. Analyze this image, photo, screenshot, or document and extract all food/beverage items, pizzas, toppings, sides, or products, along with their prices.
              For each item you find:
              - Name: Extract the clean, full title of the item.
              - Price: Extract the numeric price. If multiple sizes/prices exist, list them as separate items (e.g., "Pepperoni Pizza (Small)" and "Pepperoni Pizza (Large)").
              - Category: Classify the item into exactly one of: "Pizza", "Sides", "Drinks", "Desserts", or "Other".
              - Description: Extract any description, toppings list, or details. If none, leave empty.
              
              Return ONLY a valid JSON array matching this schema:
              [
                {
                  "name": string,
                  "price": number,
                  "category": "Pizza" | "Sides" | "Drinks" | "Desserts" | "Other",
                  "description": string
                }
              ]`
            }
          ]
        }
      ],
      config: {
        temperature: 0.1
      }
    });

    const outputText = response.text || '';
    const cleanJsonString = outputText.replace(/^```json/g, '').replace(/```$/g, '').trim();
    
    let parsedMenu;
    try {
      parsedMenu = JSON.parse(cleanJsonString);
    } catch(e) {
      console.error("Failed to parse Gemini OCR output as JSON", outputText);
      return res.status(500).json({ error: 'Failed to parse extracted menu' });
    }

    res.json(parsedMenu);
  } catch (error: any) {
    console.error('Error calling Gemini OCR:', error);
    res.status(500).json({ error: 'Failed to extract menu from image' });
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
