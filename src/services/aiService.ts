import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export async function analyzeProductImage(base64Image: string) {
  if (!ai) throw new Error("GEMINI_API_KEY is not configured");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Analyze this product image and provide: 1. A catchy professional title (In Arabic). 2. A detailed professional description (In Arabic). 3. The most appropriate category (e.g., سيارات, عقارات, إلكترونيات, أثاث, هواتف, ملابس, أخرى). 4. A price suggestion status based on visual quality (Great, Good, Fair). Return as JSON.",
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          priceStatus: { type: Type.STRING },
        },
        required: ["title", "description", "category", "priceStatus"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Analysis failed", e);
    return null;
  }
}

export async function suggestPrice(title: string, category: string) {
    if (!ai) return null;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest a reasonable price range for this item in the local market: "${title}" in category "${category}". Return a short friendly advice in Arabic.`,
    });
    
    return response.text;
}
