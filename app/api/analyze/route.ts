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
당신의 임무는 제공된 사진들이 캠핑장의 매력을 충분히 전달하고 있는지 '냉정하고 객관적으로' 평가하는 것입니다.

[중요: 점수 인플레이션 방지]
현재 점수가 너무 후하게 나오고 있습니다. 다음 기준에 맞춰 매우 엄격하게 평가하세요:
- 85점 이상: 시중의 초프리미엄 글램핑장 수준이며, 사진 작가가 찍은 듯한 완벽한 사진일 때만 부여 (매우 드묾)
- 70-80점: 시설이 훌륭하고 사진도 깔끔하지만, 몇 가지 아쉬운 점이 있을 때
- 40-60점: 일반적인 수준의 캠핑장이며 사진이 평범하거나 청결도/계절감이 충분히 표현되지 않았을 때
- 40점 미만: 사진의 화질이 낮거나, 어수선하거나, 고객에게 매력을 어필하기 어려울 때

[분석 지침]
1. 사진의 구도, 조명, 계절감, 청결 상태, 콘텐츠를 꼼꼼히 살피세요.
2. vibe_score: 사진의 감성과 분위기가 2030 고객을 끌어들일 수 있는가?
3. hygiene_score: 화장실, 침구류, 주방 등이 '완벽하게' 깨끗해 보이는가?
4. contents_score: 캠핑장만의 독특한 즐길 거리가 사진에 잘 드러나는가?
5. season_score: 계절에 맞는 분위기가 잘 연출되었는가? (겨울엔 따뜻함, 여름엔 시원함 등)
6. 각 점수는 매우 객관적으로 책정하며, 칭찬보다는 '개선할 점'을 찾는 데 집중하세요.

[응답 형식 (JSON)]
{
  "total_score": number,
  "one_line_intro": "따뜻하지만 핵심을 찌르는 한 줄 소개",
  "description": "전체적인 분석 요약 (아쉬운 점을 명확히 지적)",
  "evaluation": {
    "vibe": "감성/분위기 평가 (개선점 위주로)",
    "vibe_score": number,
    "hygiene": "청결 상태 지적 (매우 세밀하게)",
    "hygiene_score": number,
    "contents": "콘텐츠 부족함이나 보완점",
    "contents_score": number,
    "season": "계절감 연출의 한계점",
    "season_score": number
  },
  "ranking": [
    { "rank": 1, "filename": "input_file_n.png", "category": "Main", "reason": "그나마 가장 나은 사진인 이유" },
    { "rank": 2, "filename": "input_file_m.png", "category": "Facility", "reason": "이유" },
    { "rank": 3, "filename": "input_file_k.png", "category": "Activity", "reason": "이유" }
  ],
  "marketing_comment": "**강점**보다는 **개선 전략**에 80% 이상의 비중을 두어 작성"
}
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
