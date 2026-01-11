import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { saveAnalysisResult } from "@/lib/airtable";
import { AnalysisReport } from "@/lib/types";

// Allow up to 60 seconds for analysis
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Priority list of models to try
const CANDIDATE_MODELS = [
    "gemini-3-flash-preview",     // 1. Newest! (Prompted by User)
    "gemini-3-pro-preview",       // 2. Newest Pro
    "gemini-1.5-pro-latest",      // 3. Documented Best Stable
    "gemini-1.5-flash-latest",    // 4. Documented Fast Stable
    "gemini-pro"                  // 5. Logic Fallback
];

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const images = formData.getAll("images") as File[];
        const campingName = formData.get("campingName") as string;

        // Parse tags
        const leisureTags = JSON.parse(formData.get("leisureTags") as string || "[]");
        const facilityTags = JSON.parse(formData.get("facilityTags") as string || "[]");
        const activityTags = JSON.parse(formData.get("activityTags") as string || "[]");

        if (!images || images.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            console.warn("No API Key. Returning Mock.");
            return NextResponse.json(MOCK_V2_RESPONSE);
        }

        const imageParts = await Promise.all(
            images.map(async (file) => ({
                inlineData: {
                    data: Buffer.from(await file.arrayBuffer()).toString("base64"),
                    mimeType: file.type,
                }
            }))
        );

        const prompt = `
            # ROLE: Senior Growth Editor of Camfit
            # CONTEXT: Camping Name: ${campingName}, Tags: ${[...leisureTags, ...facilityTags].join(", ")}
            # TASK: Analyze images and evaluate against A-Grade Standard.
            # INSTRUCTIONS: Be strict. Output JSON ONLY.
            # OUTPUT FORMAT:
            {
                "total_score": (0-100),
                "evaluation": { "vibe": "...", "hygiene": "...", "contents": "...", "season": "..." },
                "ranking": [ { "rank": 1, "filename": "...", "category": "...", "reason": "..." } ],
                "marketing_comment": "...",
                "upsell_needed": boolean,
                "description": "..."
            }
        `;

        let finalResult = null;
        let lastError = null;

        // --- Model Fallback Loop ---
        for (const modelName of CANDIDATE_MODELS) {
            try {
                console.log(`Attempting analysis with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([prompt, ...imageParts]);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    finalResult = text;
                    break; // Success! Exit loop.
                }
            } catch (e: any) {
                console.warn(`Model ${modelName} failed:`, e.message);
                lastError = e;
                // Verify if error is 404 (Model not found) or 503 (Overloaded) and continue.
                // If it's 400 (Bad Request), it might be prompt issue, but we retry anyway.
                continue;
            }
        }

        if (!finalResult) {
            throw lastError || new Error("All AI models failed to respond.");
        }

        // --- Parsing ---
        let jsonString = finalResult.replace(/```json/g, "").replace(/```/g, "").trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        let aiData: AnalysisReport;
        try {
            aiData = JSON.parse(jsonString) as AnalysisReport;
        } catch (e) {
            throw new Error(`JSON Parsing Failed. Raw: ${finalResult.substring(0, 50)}...`);
        }

        // Attach Context
        const finalReport: AnalysisReport = {
            ...aiData,
            campingName,
            tags: { leisure: leisureTags, facility: facilityTags, activity: activityTags },
            photoCount: images.length
        };

        // Save to Airtable
        saveAnalysisResult(finalReport);

        return NextResponse.json(finalReport);

    } catch (error: any) {
        console.error("Analysis Fatal Error:", error);
        return NextResponse.json({ error: `Analysis failed: ${error.message}` }, { status: 500 });
    }
}

const MOCK_V2_RESPONSE: AnalysisReport = {
    total_score: 85,
    evaluation: { vibe: "Good", hygiene: "Clean", contents: "Fun", season: "Nice" },
    ranking: [],
    marketing_comment: "Mock Response",
    upsell_needed: false,
    description: "Mock Description",
    campingName: "Mock",
    tags: { leisure: [], facility: [], activity: [] },
    photoCount: 0
};
