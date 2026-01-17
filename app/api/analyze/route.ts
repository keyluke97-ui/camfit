import { put } from "@vercel/blob";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { saveAnalysisResult } from '@/lib/airtable';
import { sendErrorEmail } from '@/lib/email';
import { AnalysisReport } from '@/lib/types';

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
        const body = await req.json();
        const { imageUrls, campingName, address, leisureTags, facilityTags, activityTags } = body;

        if (!imageUrls || imageUrls.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            console.warn("No API Key. Returning Mock.");
            return NextResponse.json(MOCK_V2_RESPONSE);
        }

        const images = imageUrls as string[];

        // 1. Fetch Images from URLs (Client Uploaded Blobs) and Convert to Base64 for Gemini
        console.log(`Processing ${images.length} images from client URLs...`);

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
                    mimeType: "image/jpeg", // Assuming JPEG from compression
                }
            });
        }

        // URLs are already authoritative from client
        const uploadedUrls = images;

        const prompt = `
            # ROLE: Senior Growth Editor of Camfit (Korea's No.1 Camping Platform)
            
            # MISSION:
            Analyze these camping site photos to evaluate if they meet "Camfit A-Grade Standards".
            Provide a strict, professional, and strategic analysis for the host based on the Master Rubric below.

            # CONTEXT:
            - Camping Name: ${campingName}
            - Address (Location): ${address}
            - Tags: ${[...leisureTags, ...facilityTags, ...activityTags].join(", ")}
            - Photo Count: ${images.length}
            - Current Season: January (겨울) - 설경과 따뜻한 실내 조명 대비가 중요

            # MASTER RUBRIC (슈퍼팬 채점 가이드라인):
            
            ## 1. 비주얼 경쟁력 (vibe_score)
            ### 90점 이상 기준:
            - 드론 하이앵글 구도로 전체 풍경을 압도적으로 담음
            - 매직아워(일몰 전후)의 따뜻하고 부드러운 자연광
            - 텍스트가 없는 깨끗한 풍경 사진
            - 시네마틱한 색감과 구도
            
            ### 60점 이하 감점 요소:
            - 눈높이의 답답하고 평범한 구도
            - 원색(빨강/파랑/초록) 천막이 화면을 지배
            - 무질서한 주차 차량 노출
            - 경고문, 안내판 등 지저분한 요소 노출
            - 과도한 텍스트 삽입 (촌스러운 폰트)

            ## 2. 청결 안심 지수 (hygiene_score)
            ### 90점 이상 기준:
            - 무광 그레이/베이지 타일의 고급스러운 화장실
            - 물기 없이 깨끗한 세면대와 거울
            - 매립형 LED 조명의 밝고 쾌적한 분위기
            - 최신식 위생 설비
            
            ### 60점 이하 감점 요소:
            - 개수대 밑 노출된 호스나 배관
            - 초록색 수세미 등 생활감 있는 소품 노출
            - 낡고 변색된 타일
            - 습기 차고 어두운 조명
            - 곰팡이 흔적이나 청소 상태 불량

            ## 3. 콘텐츠 매력도 (contents_score)
            ### 90점 이상 기준:
            - 식물원, 별게이징 등 독보적 콘텐츠의 실체를 장면으로 증명
            - 텍스트 없이 사진만으로 경험 가치 전달
            - 고유한 체험 시설의 프리미엄 구도
            - 계절별 특화 액티비티의 생생한 포착
            
            ### 60점 이하 감점 요소:
            - 사진 위에 촌스러운 폰트로 텍스트 삽입
            - 원색 플라스틱 놀이터 시설물 위주의 구도
            - 일반적이고 차별성 없는 시설 나열
            - 실체 없는 과장 광고성 연출

            ## 4. 계절감 (season_score)
            ### 90점 이상 기준 (현재 1월 기준):
            - 설경과 텐트 내부 주황색 조명의 극적 대비
            - 겨울 특화 시네마틱 연출 (백설+난로+캠핑카)
            - 계절에 맞는 감성적 분위기
            
            ### 60점 이하 감점 요소:
            - 겨울철에 수영장 사진 노출 (계절 부적합)
            - 지저분한 쓰레기 봉투나 빨래 노출
            - 계절감 없는 무미건조한 구도
            - 시기 부적합한 콘텐츠 강조

            # INSTRUCTIONS:
            1. **LANGUAGE**: ALL OUTPUT MUST BE IN KOREAN (한국어).
            2. **TONE**: Professional, objective, yet encouraging (Smart & Sharp).
            3. **STRATEGY FORMAT**: For 'marketing_comment', use bullet points (-) and REQUIRED bold text (**) for critical action items.
            4. **IMAGE LABELING**: Use friendly labels like "1번째 이미지".
            5. **RANKING**: Select top 3 photos. Use technical labels (\`input_file_1.png\`, etc.) ONLY in "filename".
            6. **SCORING**: Apply the Master Rubric strictly. Be honest and actionable.
            7. **총합 점수 (total_score)**: 4가지 항목의 평균값으로 자동 계산.

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
            photoCount: images.length,
            uploadedUrls
        };

        // Sequential Process: Save to Airtable before returning
        console.log("Saving results to Airtable for:", campingName);
        const airtableResult = await saveAnalysisResult(finalReport);

        if (airtableResult?.success) {
            console.log("✅ Airtable Save Success, ID:", airtableResult.id);
            (finalReport as any).airtable_record_id = airtableResult.id;
        } else {
            console.warn("❌ Airtable Save Failed:", airtableResult?.error);

            // NEW: Send error log to administrator via email
            await sendErrorEmail("Airtable Save Failure", airtableResult?.error, finalReport);

            // Technical error is no longer shown to user, only a flag
            (finalReport as any).airtable_sync_failed = true;
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
