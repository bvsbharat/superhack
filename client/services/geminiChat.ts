
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export const chatWithAnalyst = async (
  query: string, 
  history: ChatMessage[],
  context: any
): Promise<string> => {
  if (!API_KEY) return "API Key not configured.";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Construct system instruction with live context
    const contextStr = JSON.stringify(context, null, 2);
    const systemPrompt = `
      You are an expert NFL analyst and Deep Research assistant for Super Bowl LIX.
      
      Current Game Context:
      ${contextStr}
      
      Your goal is to provide deep, data-driven insights, answer questions using the provided live feed data, 
      and perform reasoning on the game state. 
      
      When answering:
      1. Be concise and professional.
      2. Cite specific data points from the context (e.g., "Mahomes has 284 yards...").
      3. If the user asks about something not in the context, you can use your general NFL knowledge, 
         but prioritize the live data.
      4. If asked to predict, explain your reasoning based on the stats.
    `;

    // Format history for the API
    // Note: The new SDK might handle history differently, but for 'generateContent' we usually pass a prompt 
    // or use a chat session. For simplicity and statelessness here, we'll append history to the prompt 
    // or use the chat model if available in this SDK version similarly.
    // Let's use a simple prompt construction for now as we are using a specific model version.
    
    // Using a chat structure if supported, otherwise appending.
    // The previous code used 'gemini-3-flash-preview', let's stick to a robust text model.
    // 'gemini-2.0-flash-exp' or similar might be available, but let's use 'gemini-1.5-flash' or 'gemini-1.5-pro' if standard.
    // Given the previous file used 'gemini-3-flash-preview', I'll stick to that or 'gemini-2.0-flash'.
    
    const contents = [
      { role: 'user', parts: [{ text: `System Context: ${systemPrompt}` }] },
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: query }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: contents,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Chat analysis failed:", error);
    return "I'm having trouble analyzing that right now. Please try again.";
  }
};
