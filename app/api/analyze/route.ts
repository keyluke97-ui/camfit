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
        const campingName = formData.get("campingName") as string || "알 수 없는 캠핑장";
        const address = formData.get("address") as string || "";

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

        const payloadParts: any[] = [];
        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64");
            payloadParts.push({ text: `input_file_${i + 1}.png` });
            payloadParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                }
            });
        }

        const prompt = `
            # ROLE: Senior Growth Editor of Camfit (Korea's No.1 Camping Platform)
            
            # MISSION:
            Analyze these camping site photos to evaluate if they meet "Camfit A-Grade Standards".
            Provide a strict, professional, and strategic analysis for the host.

            # CONTEXT:
            - Camping Name: ${campingName}
            - Address (Location): ${address}
            - Tags: ${[...leisureTags, ...facilityTags, ...activityTags].join(", ")}
            - Photo Count: ${images.length}

            # INSTRUCTIONS:
            1. **LANGUAGE**: ALL OUTPUT MUST BE IN KOREAN (한국어).
            2. **TONE**: Professional, objective, yet encouraging (Smart & Sharp).
            3. **STRATEGY FORMAT**: For 'marketing_comment', use bullet points (-) and REQUIRED bold text (**) for critical action items.
            4. **CRITERIA**:
               - Vibe: 시각적 압도 (Visual aesthetics)
               - Hygiene: 시설 청결 (Cleanliness)
               - Contents: 경험 가치 (Fun factors, facilities)
               - Season: 계절감 (Seasonal appeal)
            5. **IMAGE LABELING**: Use friendly labels like "1번째 이미지".
            6. **RANKING**: Select top 3 photos. Use technical labels (\`input_file_1.png\`, etc.) ONLY in "filename".

            # OUTPUT FORMAT (Strict JSON Only):
            {
                "total_score": (0-100),
                "evaluation": { 
                    "vibe": "Evaluation...", 
                    "vibe_score": (0-100),
                    "hygiene": "Evaluation...", 
                    "hygiene_score": (0-100),
                    "contents": "Evaluation...", 
                    "contents_score": (0-100),
                    "season": "Evaluation...", 
                    "season_score": (0-100)
                },
                "ranking": [ 
                    { "rank": 1, "filename": "exact_filename", "category": "Category", "reason": "Reason" }
                ],
                "marketing_comment": "Strategic advice...",
                "upsell_needed": boolean,
                "description": "SEO description...",
                "one_line_intro": "Catchy intro (max 23 chars)"
            }
        `;

        let finalResult = null;
        let lastError = null;

        for (const modelName of CANDIDATE_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent([prompt, ...payloadParts]);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    finalResult = text;
                    break;
                }
            } catch (e: any) {
                lastError = e;
                continue;
            }
        }

        if (!finalResult) throw lastError || new Error("AI Analysis Failed");

        let jsonString = finalResult.replace(/```json/g, "").replace(/```/g, "").trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonString = jsonString.substring(firstBrace, lastBrace + 1);

        const aiData = JSON.parse(jsonString) as AnalysisReport;

        // Attach Context
        const finalReport: AnalysisReport = {
            ...aiData,
            campingName,
            address,
            tags: { leisure: leisureTags, facility: facilityTags, activity: activityTags },
            photoCount: images.length
        };

        // Sequential Process: Save to Airtable before returning
        console.log("Saving results to Airtable for:", campingName);
        const airtableRecordId = await saveAnalysisResult(finalReport);

        if (airtableRecordId) {
            console.log("✅ Airtable Save Success, ID:", airtableRecordId);
        } else {
            console.warn("❌ Airtable Save Failed. Check server logs for details.");
            // We still return the report so the user sees it in UI
        }

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
