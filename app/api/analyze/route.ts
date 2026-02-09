import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { saveAnalysisResult } from '@/lib/airtable';
import { getAnalysisPrompt } from '@/lib/prompts';

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

        // [1] 날짜 및 계절 계산 로직
        const today = new Date();
        const month = today.getMonth() + 1;

        let currentSeason = '';
        let seasonExpectation = '';

        if (month === 12 || month <= 3) {
            currentSeason = '겨울 (Winter)';
            seasonExpectation = '설경(눈), 아늑함, 난로, 온천 느낌, 따뜻한 조명';
        } else if (month >= 4 && month <= 5) {
            currentSeason = '봄 (Spring)';
            seasonExpectation = '벚꽃, 개화하는 꽃들, 파릇파릇한 잔디, 화사하고 따뜻한 분위기';
        } else if (month >= 6 && month <= 9) {
            currentSeason = '여름 (Summer)';
            seasonExpectation = '계곡, 물놀이, 시원한 그늘, 타프, 청량한 숲이나 바다 배경';
        } else {
            currentSeason = '가을 (Autumn)';
            seasonExpectation = '단풍, 낙엽, 감성적인 갈대';
        }

        // 1. Fetch Images and Prepare Payload
        console.log(`Processing ${images.length} images for Gemini Analysis...`);

        const payloadParts: any[] = [];

        // START WITH PROMPT (Instruction-First for Flash models)
        const prompt = getAnalysisPrompt(
            today.toISOString().split('T')[0],
            currentSeason,
            seasonExpectation,
            images.length
        );
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
