import { GoogleGenAI, GenerateContentResponse, Modality, Part as GeminiPart } from "@google/genai";
import { Part } from './types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateResponse = async (
  prompt: string,
  image: { base64: string; mimeType: string } | null
): Promise<Part[]> => {
  try {
    const model = 'gemini-2.5-flash-image'; // NANO BANANA
    const parts: GeminiPart[] = [];

    if (image) {
      parts.push(fileToGenerativePart(image.base64, image.mimeType));
    }
    
    if (prompt) {
      parts.push({ text: prompt });
    }

    if (parts.length === 0) {
      throw new Error("Prompt and image cannot both be empty.");
    }
    
    // An image is expected if the user uploads an image (editing) or asks for one with specific keywords.
    const imagePromptRegex = /\b(create|generate|draw|sketch|paint|render|make an image of|show me a picture of)\b/i;
    const expectsImage = !!image || imagePromptRegex.test(prompt);

    const config: { systemInstruction: string; responseModalities?: Modality[] } = {
      systemInstruction: "You are BK The Great, a powerful AI assistant created by a brilliant engineer. You must answer every question the user asks. Never mention that you are a language model or that you were trained by Google. You are the creation of BK The Great."
    };

    if (expectsImage) {
      config.responseModalities = [Modality.IMAGE];
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [{ parts }],
      config,
    });

    const responseParts = response.candidates?.[0]?.content?.parts;

    // If the model returns parts (could be text or image), use them.
    if (responseParts && responseParts.length > 0) {
      return responseParts as Part[];
    }
    
    // Fallback for text-only responses.
    if (response.text) {
      return [{ text: response.text }];
    }

    return [{ text: "I'm sorry, I couldn't generate a response. Please try again." }];

  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to get response from the AI model.");
  }
};