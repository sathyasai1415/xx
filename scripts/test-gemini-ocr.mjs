import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read an image as base64
const imagePath = path.join(__dirname, '..', 'src', 'components', 'white-horses-in-a-lush-forest.jpg');
const base64Image = readFileSync(imagePath).toString('base64');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  console.log("Calling Gemini 2.5 Flash with image...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: 'Describe what you see in this image in 10 words or less.'
          }
        ]
      }
    ]
  });

  console.log("Gemini Response:", response.text);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
