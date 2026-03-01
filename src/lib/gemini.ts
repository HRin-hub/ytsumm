import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// By default, it uses the GEMINI_API_KEY environment variable.
export const ai = new GoogleGenAI({});
