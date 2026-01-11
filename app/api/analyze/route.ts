import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
// import { saveAnalysisResult } from "@/lib/airtable"; 

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as File;
        const campingName = formData.get("campingName") as string;

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            // Fallback for demo without API key
            console.warn("No Google API Key found. Returning mock data.");
            return NextResponse.json(MOCK_RESPONSE);
        }

        const buffer = await image.arrayBuffer();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
      Analyze this camping site photo for a "Growth Report".
      Evaluate 4 metrics on a scale of 0-100:
      1. Vibe (Visual aesthetics, emotional appeal)
      2. Hygiene (Cleanliness, maintenance)
      3. Contents (Activities, facilities)
      4. Season (Seasonal atmosphere)
      
      Also provide a 1-sentence comment for each.
      Return ONLY JSON in this format:
      {
        "totalScore": number,
        "metrics": {
          "vibe": { "score": number, "comment": string, "trend": "up"|"down"|"neutral" },
          "hygiene": { "score": number, "comment": string, "trend": "up"|"down"|"neutral" },
          "contents": { "score": number, "comment": string, "trend": "up"|"down"|"neutral" },
          "season": { "score": number, "comment": string, "trend": "up"|"down"|"neutral" }
        }
      }
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: Buffer.from(buffer).toString("base64"),
                    mimeType: image.type,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean code fences if present
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        // Append context
        const finalData = { ...data, campingName };

        // Async save to Airtable (fire and forget)
        // saveAnalysisResult(finalData);

        return NextResponse.json(finalData);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}

const MOCK_RESPONSE = {
    totalScore: 88,
    metrics: {
        vibe: { score: 92, comment: "Fantastic lighting and atmosphere.", trend: "up" },
        hygiene: { score: 85, comment: "Looks clean but some clutter visible.", trend: "neutral" },
        contents: { score: 90, comment: "Great amenities for families.", trend: "up" },
        season: { score: 80, comment: "Good summer vibes.", trend: "neutral" }
    }
};
