import { GoogleGenAI } from "@google/genai";

export const generateBackgroundImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-2.5-flash-image for speed as per guidelines for general generation
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Create a high quality, abstract, atmospheric background image suitable for a music app. 
                 Style: ${prompt}. 
                 No text, no instruments, just pure mood, vibes, and lighting. 
                 Cinematic lighting, 4k resolution.` 
        }
      ]
    }
  });

  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image data returned from Gemini.");
};
