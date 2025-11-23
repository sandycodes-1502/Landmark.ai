import { GoogleGenAI, Modality } from "@google/genai";
import { AnalysisResult, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Identify the landmark from the image.
 * Model: gemini-3-pro-preview (Best for vision/reasoning)
 */
export const identifyLandmark = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Identify this landmark. Return ONLY the specific name of the landmark. If it is not a recognizable landmark, return 'Unknown'. Do not add any punctuation or extra text.",
          },
        ],
      },
    });

    const text = response.text?.trim();
    if (!text || text.toLowerCase() === 'unknown') {
      throw new Error("Could not identify a landmark in this image.");
    }
    return text;
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
};

/**
 * Step 2: Get history and fun facts using Google Search.
 * Model: gemini-2.5-flash (Fast, supports Search tool)
 */
export const fetchLandmarkDetails = async (landmarkName: string): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tell me a fascinating short history and 2 fun facts about ${landmarkName}. Keep it engaging and concise (under 150 words total).`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No details found.";
    
    // Extract sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Search Error:", error);
    throw new Error("Failed to retrieve landmark details.");
  }
};

/**
 * Step 3: Generate speech from the text.
 * Model: gemini-2.5-flash-preview-tts
 */
export const generateNarration = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, narrative voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data generated.");
    }
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw new Error("Failed to generate narration.");
  }
};

/**
 * Orchestrator function to run the full pipeline.
 */
export const analyzeImagePipeline = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  // 1. Identify
  const landmarkName = await identifyLandmark(base64Image, mimeType);
  
  // 2. Search
  const { text: historyText, sources } = await fetchLandmarkDetails(landmarkName);

  // 3. Narrate
  // We prepend a short intro to make it sound natural
  const script = `Here is what I found about ${landmarkName}. ${historyText}`;
  const audioBase64 = await generateNarration(script);

  return {
    landmarkName,
    historyText,
    audioBase64,
    sources,
  };
};

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
