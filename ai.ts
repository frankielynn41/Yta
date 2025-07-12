import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns a singleton instance of the GoogleGenAI client.
 * This prevents initialization from happening at the module's top level, which
 * can cause race conditions in a browser environment.
 * @returns {GoogleGenAI} The initialized AI client.
 * @throws {Error} If the API_KEY is not available.
 */
export const getAiClient = (): GoogleGenAI => {
    if (aiInstance) {
        return aiInstance;
    }

    let apiKey: string | undefined;
    try {
      apiKey = process.env.API_KEY;
    } catch (e) {
      apiKey = undefined;
    }

    if (!apiKey) {
        throw new Error("Gemini AI is not configured. Please ensure the API_KEY environment variable is set.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
};
