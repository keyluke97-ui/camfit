import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { saveAnalysisResult } from '@/lib/airtable';

const getApiKey = () => {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
};

const genAI = new GoogleGenerativeAI(getApiKey());

export async function POST(request: Request) {
    try {
        if (!getApiKey()) {
            return NextResponse.json({ error: "API Key가 설정되지 않았습니다. (GEMINI_API_KEY)" }, { status: 500 });
        }

        const body = await request.json();
        const { imageUrls, campingName, address, leisureTags, facilityTags, activityTags } = body;

        // Normalize tags for Airtable/Analysis
        const tags = {
            leisure: leisureTags || [],
            facility: facilityTags || [],
            activity: activityTags || []
        };

        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return NextResponse.json({ error: "분석할 사진이 없습니다." }, { status: 400 });
        }

        const images = imageUrls as string[];

        // 1. Fetch Images and Prepare Payload
        console.log(`Processing ${images.length} images for Gemini Analysis...`);

        const payloadParts: any[] = [];

        // START WITH PROMPT (Instruction-First for Flash models)
        const prompt = `
당신은 캠핑장 전문 컨설턴트이자 포토 에디터입니다. 
당신의 임무는 제공된 사진들이 캠핑장의 매력을 충분히 전달하고 있는지 '객관적으로 평가하되, 사장님의 노력을 공감하는 따뜻한 어조'로 분석하는 것입니다.

[지침]
- 가점: 매직아워(暖色), 광각 렌즈, 건식 화장실, 고유 콘텐츠.
- 감점: 원색 노이즈(빨강/파랑 천막), 생활 쓰레기, 물기, 계절 불일치, 저조도.
- 어조: 평가는 냉정하고 객관적으로 하되, 사장님께 드리는 제언은 따뜻하고 격려하는 어조를 사용하세요.

### CRITICAL CONSTRAINTS:
1. 제공된 사진이 총 ${images.length}장이므로, 모든 파일명은 반드시 input_file_1부터 input_file_${images.length} 사이에서만 선택해야 합니다.
2. 존재하지 않는 파일명(예: input_file_${images.length + 1})을 절대 생성하지 마세요.
3. 절대 모든 지표를 0점이나 '내용 없음'으로 채우지 마세요. 사진의 화질이 다소 압축되어 있더라도 시각적 힌트를 찾아 최대한 성실하게 점수를 부여하세요.
4. 분석 결과는 반드시 유효한 JSON 형식이어야 합니다.

[응답 형식 (JSON)]
{
  "total_score": number,
  "one_line_intro": "29자(공백 포함) 이내의 유저 타겟팅 후킹 멘트",
  "description": "유저에게 캠핑장의 매력을 어필하고 예약을 유도하는 홍보용 소개글",
  "evaluation": {
    "vibe": "사장님을 위한 감성/분위기 평가",
    "vibe_score": number,
    "hygiene": "사장님을 위한 청결 상태 지적",
    "hygiene_score": number,
    "contents": "사장님을 위한 콘텐츠 보완점",
    "contents_score": number,
    "season": "사장님을 위한 계절감 연출 및 보완점",
    "season_score": number
  },
  "ranking": [
    { "rank": 1, "filename": "input_file_n", "category": "Main", "reason": "이유" },
    { "rank": 2, "filename": "input_file_m", "category": "Facility", "reason": "이유" },
    { "rank": 3, "filename": "input_file_k", "category": "Activity", "reason": "이유" }
  ],
  "marketing_comment": "개선 전략 위주의 대화형 피드백"
}
`;
        payloadParts.push({ text: prompt });

        // Parallel Fetch for Images
        const imageBuffers = await Promise.all(
            images.map(async (url) => {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
                return res.arrayBuffer();
            })
        );

        for (let i = 0; i < images.length; i++) {
            const base64Data = Buffer.from(imageBuffers[i]).toString("base64");
            payloadParts.push({ text: `input_file_${i + 1}` });
            payloadParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                }
            });
        }

        // 2. AI Analysis Request
        console.log("Starting Gemini Analysis (Instruction-First)...");
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(payloadParts);
        const response = await result.response;
        const rawText = response.text();

        console.log("Gemini Raw Response Header:", rawText.substring(0, 100));

        if (!rawText || rawText.trim() === "") {
            throw new Error("AI가 응답을 생성하지 못했습니다. (Empty Response)");
        }

        // Defensive JSON Parsing
        let cleanJson = rawText.trim();
        if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        }

        let analysisData;
        try {
            analysisData = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("JSON Parse Error. Raw Text:", rawText);
            throw new Error(`AI 응답 형식 오류: ${rawText.substring(0, 100)}...`);
        }

        // 3. Save to Airtable (Background try/catch)
        let airtableId = "";
        let airtableSyncFailed = false;
        try {
            const saveResult = await saveAnalysisResult({
                ...analysisData,
                campingName,
                address,
                tags,
                uploadedUrls: images
            });
            if (saveResult.success) {
                airtableId = saveResult.id!;
            } else {
                airtableSyncFailed = true;
            }
        } catch (e) {
            console.error("Airtable sync error:", e);
            airtableSyncFailed = true;
        }

        return NextResponse.json({
            ...analysisData,
            uploadedUrls: images,
            airtable_record_id: airtableId,
            airtable_sync_failed: airtableSyncFailed
        });

    } catch (error: any) {
        console.error("Analyze API Error:", error);
        return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
    }
}
