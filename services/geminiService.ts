
import { GoogleGenAI, Type } from "@google/genai";
import { ThemeConfig, GeminiCommentary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRandomTheme = async (): Promise<ThemeConfig> => {
  const prompt = `Create a unique visual theme for a flappy bird style game. 
  The theme should be creative (e.g. Cyberpunk, Underwater, Candy Land, Haunted Forest, Space).
  Provide a color palette and a single emoji for the player.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            skyColor: { type: Type.STRING, description: "Hex code for the sky background" },
            pipeColor: { type: Type.STRING, description: "Hex code for the obstacles" },
            groundColor: { type: Type.STRING, description: "Hex code for the ground" },
            birdEmoji: { type: Type.STRING, description: "Single emoji for the bird" },
            accentColor: { type: Type.STRING, description: "Hex code for UI highlights" }
          },
          required: ["name", "description", "skyColor", "pipeColor", "groundColor", "birdEmoji", "accentColor"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating theme:", error);
    throw error;
  }
};

export const getSnarkyComment = async (score: number): Promise<GeminiCommentary> => {
  const prompt = `The player just finished a game of Flappy Bird with a score of ${score}. 
  Provide a very short, witty, and slightly snarky comment about their performance. 
  Keep it under 15 words. Also categorize the 'vibe' of the comment (e.g., 'Savage', 'Encouraging', 'Sarcastic').`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            vibe: { type: Type.STRING }
          },
          required: ["message", "vibe"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating comment:", error);
    return { message: "Ouch, gravity hurts.", vibe: "Neutral" };
  }
};
