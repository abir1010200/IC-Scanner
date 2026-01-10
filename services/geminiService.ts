
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ICIntelligenceReport } from "../types";

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    identification: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        number: { type: Type.STRING },
        manufacturer: { type: Type.STRING },
        family: { type: Type.STRING },
        confidence: { type: Type.NUMBER, description: "Confidence score as a WHOLE NUMBER from 0 to 100." },
      },
      required: ["name", "number", "manufacturer", "family", "confidence"],
    },
    technicalProfile: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          label: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ["id", "label", "value"],
      },
      description: "Exactly 15 essential technical characteristics of the IC.",
    },
    pinout: {
      type: Type.OBJECT,
      properties: {
        diagram: { type: Type.STRING, description: "Detailed ASCII art pin diagram (blueprint style)" },
        table: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pin: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["pin", "name", "description"],
          }
        },
        warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["diagram", "table", "warnings"],
    },
    testing: {
      type: Type.OBJECT,
      properties: {
        multimeter: { type: Type.ARRAY, items: { type: Type.STRING } },
        oscilloscope: { type: Type.ARRAY, items: { type: Type.STRING } },
        expectedVoltages: { type: Type.STRING },
        faultSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
        safety: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["multimeter", "oscilloscope", "expectedVoltages", "faultSymptoms", "safety"],
    },
    marketPrice: {
      type: Type.OBJECT,
      properties: {
        prices: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING },
              price: { type: Type.STRING },
              availability: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ["store", "price", "availability"],
          }
        },
        indiaRetailers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING },
              price: { type: Type.STRING },
              availability: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["store", "price", "availability", "url"]
          }
        },
        minPrice: { type: Type.STRING },
        maxPrice: { type: Type.STRING },
        bulkTrend: { type: Type.STRING },
      },
      required: ["prices", "indiaRetailers", "minPrice", "maxPrice", "bulkTrend"],
    },
    resources: {
      type: Type.OBJECT,
      properties: {
        wikipedia: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            title: { type: Type.STRING },
            url: { type: Type.STRING }
          },
          required: ["platform", "title", "url"]
        },
        youtubeVideos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              title: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["platform", "title", "url"]
          }
        },
        officialDatasets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["name", "url"]
          }
        }
      },
      required: ["youtubeVideos", "officialDatasets"]
    },
    caseStudy: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        outcome: { type: Type.STRING }
      },
      required: ["title", "description", "outcome"]
    },
    useCases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of real-world use cases for this specific IC."
    },
    references: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        youtubeKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        datasheetNotes: { type: Type.STRING },
        datasetLinks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["name", "url"]
          }
        }
      },
      required: ["summary", "youtubeKeywords", "datasheetNotes", "datasetLinks"],
    },
    applications: {
      type: Type.OBJECT,
      properties: {
        consumer: { type: Type.STRING },
        industrial: { type: Type.STRING },
        automotiveIot: { type: Type.STRING },
        typicalCircuits: { type: Type.STRING },
      },
      required: ["consumer", "industrial", "automotiveIot", "typicalCircuits"],
    },
    confidence: {
      type: Type.OBJECT,
      properties: {
        ocrScore: { type: Type.NUMBER },
        idScore: { type: Type.NUMBER },
        disclaimer: { type: Type.STRING },
      },
      required: ["ocrScore", "idScore", "disclaimer"],
    },
  },
  required: ["identification", "technicalProfile", "pinout", "testing", "marketPrice", "resources", "caseStudy", "useCases", "references", "applications", "confidence"],
};

export const analyzeIC = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<ICIntelligenceReport> => {
  if (!process.env.API_KEY) {
    throw new Error("Missing API Key. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    SCAN PROTOCOL:
    1. OCR: Identify the chip from markings. If markings are blurry, use context of packaging/pins.
    2. TECHNICAL: Provide exactly 15 key electrical and thermal specifications.
    3. PINOUT: Generate a visual ASCII pinout diagram and a full functional table for every pin.
    4. RESOURCES: Fetch 1 Wikipedia link, 2 relevant YouTube repair/guide videos, and at least 3 dataset/datasheet links.
    5. CASE STUDY: Provide a detailed case study of a real-world scenario where this IC was used, its role, and the outcome/findings.
    6. USE CASES: List 5 distinct real-world applications/use cases for this specific integrated circuit.
    7. INDIA MARKET: Fetch pricing for Indian retailers (Mouser India, Digikey India, Robu.in, Element14 India). Compare prices in INR.
    
    STRICT JSON OUTPUT AS PER SCHEMA. NO PREAMBLE.
  `;

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
    },
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: reportSchema,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 32768 }, 
    },
  });

  const report: ICIntelligenceReport = JSON.parse(response.text || '{}');
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    report.groundingSources = groundingChunks
      .map((chunk: any) => {
        if (chunk.web) {
          return {
            title: chunk.web.title,
            uri: chunk.web.uri,
          };
        }
        return null;
      })
      .filter((item: any): item is { title: string; uri: string } => item !== null);
  }

  return report;
};

export const askAboutIC = async (icName: string, question: string, icData: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  const prompt = `Expert IC Context: ${icData}. Question: ${question}`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
        thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  
  return response.text || "Unable to process query.";
};
