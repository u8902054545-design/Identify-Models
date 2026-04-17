import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export const getGeminiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable. Please configure it in your settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface BrandIdentity {
  brandName: string;
  tagline: string;
  logoPrompt: string;
  secondaryLogoPrompt: string;
  colors: { hex: string; name: string; usage: string }[];
  fonts: {
    header: { name: string; fallback: string; description: string };
    body: { name: string; fallback: string; description: string };
  };
  voice: string;
}

export const generateBrandData = async (mission: string): Promise<BrandIdentity> => {
  const ai = getGeminiClient();
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      brandName: { type: Type.STRING, description: "A catchy, memorable brand name based on the mission." },
      tagline: { type: Type.STRING, description: "A short, punchy tagline." },
      logoPrompt: { type: Type.STRING, description: "A highly detailed image generation prompt for the primary logo. Specify 'vector art', 'clean white background', 'minimalist' or similar styles." },
      secondaryLogoPrompt: { type: Type.STRING, description: "A highly detailed image generation prompt for a secondary logo mark or app icon. Specify 'vector art', 'clean white background'." },
      colors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hex: { type: Type.STRING, description: "The hex code, e.g., #FF5733" },
            name: { type: Type.STRING, description: "A creative name for this color" },
            usage: { type: Type.STRING, description: "How this color should be used (e.g., Primary Background, Accent, CTA)" }
          },
          required: ["hex", "name", "usage"]
        },
        description: "Exactly 5 brand colors forming a cohesive palette."
      },
      fonts: {
        type: Type.OBJECT,
        properties: {
          header: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "A Google Font name suitable for headers, e.g. 'Playfair Display' or 'Space Grotesk'" },
              fallback: { type: Type.STRING, description: "CSS fallback stack, e.g. 'serif' or 'sans-serif'" },
              description: { type: Type.STRING, description: "Why this font works for the headers" }
            },
            required: ["name", "fallback", "description"]
          },
          body: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "A highly legible Google Font name suitable for body text, e.g. 'Inter' or 'Lora'" },
              fallback: { type: Type.STRING, description: "CSS fallback stack" },
              description: { type: Type.STRING, description: "Why this font works for body copy" }
            },
            required: ["name", "fallback", "description"]
          }
        },
        required: ["header", "body"]
      },
      voice: { type: Type.STRING, description: "A brief description of the brand's tone of voice and personality." }
    },
    required: ["brandName", "tagline", "logoPrompt", "secondaryLogoPrompt", "colors", "fonts", "voice"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are an expert Brand Strategist and Designer. Given the following company mission, generate a cohesive brand identity.\n\nMission: ${mission}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate brand identity.");
  }
  
  return JSON.parse(text) as BrandIdentity;
};

export const generateBrandImage = async (prompt: string, size: "1K" | "2K" | "4K"): Promise<string> => {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image was returned by the model.");
};

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export type ChatModelLevel = "fast" | "general" | "complex";

export const getBrandChatResponse = async (history: ChatMessage[], newPrompt: string, level: ChatModelLevel, brandContext?: BrandIdentity): Promise<string> => {
  const ai = getGeminiClient();
  
  let modelName = "gemini-3-flash-preview";
  if (level === "fast") modelName = "gemini-3.1-flash-lite-preview";
  if (level === "complex") modelName = "gemini-3.1-pro-preview";

  let systemInstruction = "You are a world-class brand strategist and design consultant. Help the user refine their brand identity, mission, and visual approach. Be concise, insightful, and professional.";
  if (brandContext) {
    systemInstruction += `\n\nCurrent Brand Identity Context:\nName: ${brandContext.brandName}\nTagline: ${brandContext.tagline}\nColors: ${brandContext.colors.map(c => c.hex).join(", ")}\nFonts: ${brandContext.fonts.header.name}, ${brandContext.fonts.body.name}\nVoice: ${brandContext.voice}`;
  }

  // Format history for the API
  const formattedContents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  formattedContents.push({ role: "user", parts: [{ text: newPrompt }] });

  const response = await ai.models.generateContent({
    model: modelName,
    // @ts-ignore - formatting is valid
    contents: formattedContents,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  if (!response.text) {
    throw new Error("Chat response was empty.");
  }

  return response.text;
};
