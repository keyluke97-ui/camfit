import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { saveAnalysisResult } from '@/lib/airtable';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrls, campingName, address, tags } = body;

        if (!imageUrls || !Array.isArray(imageUrls)) {
            return NextResponse.json({ error: "Missing images" }, { status: 400 });
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
제공된 사진들을 분석하여 사장님(40-60대)이 이해하기 쉬운 따뜻하고 전문적인 말투로 진단해주세요.

[분석 지침]
1. 각 사진의 파일명(input_file_n.png)을 정확히 참조하여 사진 랭킹을 매기세요.
2. vibe_score(비주얼), hygiene_score(청결), contents_score(콘텐츠), season_score(계절감)를 0~100점으로 평가하세요.
3. total_score는 위 점수들의 평균이 아닌, 전체적인 완성도를 고려하여 산출하세요.
4. '에디터 핵심 개선 전략'에는 사장님이 바로 실천할 수 있는 팁을 구체적으로 적어주세요.

[응답 형식 (JSON)]
{
  "total_score": number,
  "one_line_intro": "따뜻한 한 줄 소개",
  "description": "전체적인 분석 요약 (따뜻한 말투)",
  "evaluation": {
    "vibe": "항목별 상세 요약",
    "vibe_score": number,
    "hygiene": "청결/시설 상태 분석",
    "hygiene_score": number,
    "contents": "즐길거리/콘텐츠 분석",
    "contents_score": number,
    "season": "계절감/마케팅 효율 상세",
    "season_score": number
  },
  "ranking": [
    { "rank": 1, "filename": "input_file_n.png", "category": "Main", "reason": "이유" },
    { "rank": 2, "filename": "input_file_m.png", "category": "Facility", "reason": "이유" },
    { "rank": 3, "filename": "input_file_k.png", "category": "Activity", "reason": "이유" }
  ],
  "marketing_comment": "**강점**과 **개선점**이 포함된 구체적인 전략 코멘트"
}
`;

        payloadParts.push({ text: prompt });
        const result = await model.generateContent(payloadParts);
        const response = await result.response;
        const analysisData = JSON.parse(response.text());

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
