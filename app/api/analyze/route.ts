import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { saveAnalysisResult } from "@/lib/airtable";
import { AnalysisReport } from "@/lib/types";

// Allow up to 60 seconds for complex analysis (Vercel Pro/Hobby limits may vary)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Using 'gemini-1.5-pro-latest' - the canonical alias to avoid version 404 errors.
// This points to the latest stable 1.5 Pro model.
const MODEL_NAME = "gemini-1.5-pro-latest";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const images = formData.getAll("images") as File[];
        const campingName = formData.get("campingName") as string;

        // Parse tags to context
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

        // Prepare inputs for Gemini
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const imageParts = await Promise.all(
            images.map(async (file) => ({
                inlineData: {
                    data: Buffer.from(await file.arrayBuffer()).toString("base64"),
                    mimeType: file.type,
                }
            }))
        );

        const prompt = `
      # ROLE: You are the 'Senior Growth Editor' of Camfit, Korea's No.1 Camping Booking Platform. 
      Your mission is to analyze these photos submitted by a camp host and evaluate them against Camfit's "A-Grade Standard (100 points)".

      # CONTEXT:
      - Camping Name: ${campingName}
      - Host Selected Facilities/Tags: [${[...leisureTags, ...facilityTags, ...activityTags].join(", ")}]

      # CAMFIT A-GRADE BENCHMARK (Criteria):
      1. **Vibe (Visual Awe)**: Does it look like a dream destination? Drone shots, night lights, symmetry? Cleanliness (no messy wires)?
      2. **Hygiene (Hotel-grade)**: Does it look cleaner than a home? Premium tiles, indirect lighting in restrooms?
      3. **Contents (Killer Experience)**: Is the fun visualized? Swimming pools, events, clear branding?
      4. **Season (Urgency)**: Does it show WHY to go NOW (snow, autumn leaves, warm pool)?

      # INSTRUCTIONS:
      - Analyze ALL images as one content package.
      - Be strict. If photos are blurry, messy, or boring, deduct points heavily.
      - Select the TOP ranking photos that would trigger clicks.
      - OUTPUT JSON ONLY.

      # OUTPUT FORMAT (Strict JSON Only):
      {
        "total_score": (0-100 integer),
        "evaluation": {
            "vibe": "Evaluation text for Vibe...",
            "hygiene": "Evaluation text for Hygiene...",
            "contents": "Evaluation text for Contents...",
            "season": "Evaluation text for Season..."
        },
        "ranking": [
            {"rank": 1, "filename": "describe the photo briefly", "category": "Main/Facility/Activity/Season", "reason": "Why is this #1?"},
            {"rank": 2, "filename": "...", "category": "...", "reason": "..."}
        ],
        "marketing_comment": "One strategic sentence for the host",
        "upsell_needed": (boolean, true if score < 80),
        "description": "An emotional, SEO-optimized description of this camping site based on the photos."
      }
    `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        // 1. Clean Markdown Code Blocks
        let jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // 2. Extract JSON strictly if model chats
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        let aiData: AnalysisReport;
        try {
            aiData = JSON.parse(jsonString) as AnalysisReport;
        } catch (e) {
            console.error("JSON Parse Error. Raw Text:", text);
            throw new Error(`AI 응답 형식 오류 (JSON Parse Failed). Raw: ${text.substring(0, 100)}...`);
        }

        // Attach Context
        const finalReport: AnalysisReport = {
            ...aiData,
            campingName,
            tags: { leisure: leisureTags, facility: facilityTags, activity: activityTags },
            photoCount: images.length
        };

        // Save to Airtable asynchronously
        saveAnalysisResult(finalReport);

        return NextResponse.json(finalReport);

    } catch (error: any) {
        console.error("V2 Analysis Error:", error);
        const errorMessage = error.message || "Unknown Server Error";
        return NextResponse.json({ error: `Analysis failed: ${errorMessage}` }, { status: 500 });
    }
}

const MOCK_V2_RESPONSE: AnalysisReport = {
    total_score: 85,
    evaluation: {
        vibe: "전반적인 채광과 자연 풍경은 훌륭하나, 일부 텐트 주변의 집기 정리가 필요해 보입니다.",
        hygiene: "화장실 타일과 개수대 상태가 매우 청결하게 관리되고 있어 신뢰감을 줍니다.",
        contents: "수영장 시설이 잘 갖춰져 있으나, 이를 즐기는 사람들의 표정이나 생동감이 부족합니다.",
        season: "주변 나무들의 상태로 보아 계절감이 잘 드러나고 있습니다."
    },
    ranking: [
        { rank: 1, filename: "Pool View", category: "Activity", reason: "가장 시설 규모가 커보이고 시원한 느낌을 줌" },
        { rank: 2, filename: "Tent Night", category: "Main", reason: "조명 분위기가 감성적임" }
    ],
    marketing_comment: "시설 퀄리티는 최상급이므로, '밤의 분위기'를 담은 사진을 메인으로 교체하면 예약률 15% 상승이 예상됩니다.",
    upsell_needed: false,
    description: "쏟아지는 별빛 아래, 호텔급 청결함을 자랑하는 프리미엄 글램핑. 아이들을 위한 온수 수영장에서 잊지 못할 추억을 만드세요.",
    campingName: "Mock Camping",
    tags: { leisure: [], facility: [], activity: [] },
    photoCount: 5
};
