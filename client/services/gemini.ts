
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Validate API key on module load
if (typeof window !== 'undefined') { // Only in browser
  if (!API_KEY) {
    console.error('⚠️ GEMINI API_KEY not configured - AI image generation will fail');
    console.error('Set API_KEY in .env.local file');
  } else {
    console.log('✅ Gemini API key configured');
  }
}

export const generateSportImage = async (prompt: string): Promise<string | null> => {
  if (!API_KEY) {
    console.error('Cannot generate image: API_KEY not configured');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return null;
};

export interface AISearchResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getLiveInsights = async (query: string): Promise<AISearchResult | null> => {
  if (!API_KEY) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a professional NFL sports analyst. Provide concise, data-driven insights about Super Bowl LIX. Focus on strategy, current news, and odds."
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web)
      ?.map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      })) || [];

    return {
      text: response.text || "No insights available at this moment.",
      sources: sources
    };
  } catch (error) {
    console.error("AI Insight failed:", error);
    return null;
  }
};

export interface AnalysisResult {
    timestamp: string;
    event: string;
    details: string;
    confidence: number;
}

export const analyzeMatchVideo = async (file: File): Promise<AnalysisResult[] | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://localhost:8000/analyze_video", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.analysis;
    } catch (error) {
        console.error("Video analysis failed:", error);
        return null;
    }
};

export const analyzeYoutubeVideo = async (url: string): Promise<{ video_info: any, analysis: AnalysisResult[] } | null> => {
    try {
        const response = await fetch("http://localhost:8000/analyze_youtube", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("YouTube analysis failed:", error);
        return null;
    }
};
