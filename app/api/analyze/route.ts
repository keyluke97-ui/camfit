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

        // 1. Fetch Images from Cloudinary URLs and Convert to Base64 for Gemini
        console.log(`Processing ${images.length} images from Cloudinary...`);

        const payloadParts: any[] = [];

        // Parallel Fetch
        const imageBuffers = await Promise.all(
            images.map(async (url) => {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
                return res.arrayBuffer();
            })
        );

        for (let i = 0; i < images.length; i++) {
            const base64Data = Buffer.from(imageBuffers[i]).toString("base64");
            payloadParts.push({ text: `input_file_${i + 1}.png` });
            payloadParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                }
            });
        }

        // 2. AI Analysis Request
        console.log("Starting Gemini Analysis...");
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
당신은 캠핑장 전문 컨설턴트이자 포토 에디터입니다. 
당신의 임무는 제공된 사진들이 캠핑장의 매력을 충분히 전달하고 있는지 '객관적으로 평가하되, 사장님의 노력을 공감하는 따뜻한 어조'로 분석하는 것입니다.

[점수 산정 정밀 가이드 (Rubric)]
모든 지표는 아래 기준에 따라 매우 엄격하고 일관되게 산정하세요.

1. vibe_score (비주얼 경쟁력)
- 90~100점 (시네마틱): 드론/광각샷, 매직아워/감성 조명 활용, 시각적 노이즈(전선 등) 없음.
- 70~89점 (깔끔한 전문성): 화질 우수, 현대적 시설, 정돈되었으나 예술적 한 방 부족.
- 50~69점 (일반 유원지): 원색 천막, 무질서한 주차 등 시선 분산 요소 존재. 기능 위주 사진.
- 40~49점 (신뢰 하락): 저화질, 역광, 노후 시설물로 인해 브랜드 신뢰도 저해.

2. hygiene_score (청결 안심 지수)
- 90~100점 (호텔급 건식): 무광 타일, 물기 없는 바닥, 완벽한 새것의 느낌.
- 70~89점 (정돈된 관리): 시설 연식은 있으나 청결하고 정돈됨. 고급스러움은 부족.
- 50~69점 (생활감 노출): 수세미, 세제통, 바닥 물기 등 '남이 사용한 흔적' 보임.
- 40~49점 (위생 경고): 곰팡이, 녹슨 수전, 관리 부실이 명확히 느껴짐.
- ※ 60점 (판정 불가): 화장실/샤워실/주방 사진이 없을 경우 고정 점수.

3. contents_score (콘텐츠 매력도)
- 90~100점 (독보적 스토리): 킬러 콘텐츠(체험, 온천 등)를 감성적으로 전달.
- 70~89점 (정보 전달형): 부대시설이 깔끔하게 노출되나 정보 위주의 정직한 연출.
- 50~69점 (투박한 연출): 촌스러운 폰트, 원색 플라스틱 등 시각적 매력 반감 요소 존재.
- 40~49점 (방치된 시설): 오염되거나 파손된 놀이기구 등 이미지 저해.

4. season_score (계절 마케팅)
- 90~100점 (시즌 로망): 해당 계절에만 느낄 수 있는 극적인 로망 극대화.
- 70~89점 (적절한 시즌감): 계절감은 명확하나 감성을 자극하기엔 평범함.
- 50~69점 (로망 훼손): 풍경은 좋으나 생활 노이즈(빨래, 눈 위 타이어 자국 등) 포함.
- 40~49점 (시즌 불일치): 계절에 맞지 않는 사진(예: 한겨울에 여름 수영장).

[지침]
- 가점: 매직아워(暖色), 광각 렌즈, 건식 화장실, 고유 콘텐츠.
- 감점: 원색 노이즈(빨강/파랑 천막), 생활 쓰레기, 물기, 계절 불일치, 저조도.
- 어조: 평가는 냉정하고 객관적으로 하되, 사장님께 드리는 제언은 따뜻하고 격려하는 어조를 사용하세요.

[응답 형식 (JSON)]
{
  "total_score": number,
  "one_line_intro": "29자(공백 포함) 이내의 유저 타겟팅 후킹 멘트 (캠핑장 정보와 사진 기반)",
  "description": "유저에게 캠핑장의 매력을 어필하고 예약을 유도하는 홍보용 소개글",
  "evaluation": {
    "vibe": "사장님을 위한 감성/분위기 평가 (개선점 위주로)",
    "vibe_score": number,
    "hygiene": "사장님을 위한 청결 상태 지적 (세밀하게)",
    "hygiene_score": number,
    "contents": "사장님을 위한 콘텐츠 보완점",
    "contents_score": number,
    "season": "사장님을 위한 계절감 연출 및 보완점",
    "season_score": number
  },
  "ranking": [
    { "rank": 1, "filename": "input_file_n.png", "category": "Main", "reason": "가장 매력적인 메인 이미지인 이유" },
    { "rank": 2, "filename": "input_file_m.png", "category": "Facility", "reason": "이유" },
    { "rank": 3, "filename": "input_file_k.png", "category": "Activity", "reason": "이유" }
  ],
  "marketing_comment": "**강점**보다는 **개선 전략**에 80% 이상의 비중을 두며, 사장님이 실행 가능한 따뜻한 조언으로 작성"
}

### CRITICAL CONSTRAINTS:
1. 제공된 사진이 총 ${images.length}장이므로, 모든 파일명은 반드시 input_file_1부터 input_file_${images.length} 사이에서만 선택해야 합니다.
2. 존재하지 않는 파일명(예: input_file_${images.length + 1})을 절대 생성하지 마세요.
3. 사진이 부족하더라도 반드시 제공된 범위 내의 사진만 사용하세요.
`;

        payloadParts.push({ text: prompt });
        const result = await model.generateContent(payloadParts);
        const response = await result.response;
        const rawText = response.text();

        if (!rawText || rawText.trim() === "") {
            throw new Error("AI가 응답을 생성하지 못했습니다. (Empty Response)");
        }

        // Defensive JSON Parsing: Strip markdown blocks if present
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
