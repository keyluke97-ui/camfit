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

        // [1] 날짜 및 계절 계산 로직
        const today = new Date();
        const month = today.getMonth() + 1;

        let currentSeason = '';
        let seasonExpectation = '';

        if (month === 12 || month <= 3) {
            currentSeason = '겨울 (Winter)';
            seasonExpectation = '설경(눈), 장박 텐트의 아늑함, 난로, 온천 느낌, 따뜻한 조명';
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
        const prompt = `
당신은 캠핏의 1000개가 넘는 캠핑장의 사진을 분석한 전문 컨설턴트이자, 포토 에디터입니다.
당신은 한국의 캠핑 트렌드를 잘 아는 '전문 캠핑 큐레이터'입니다. 제공된 **1~10장의 이미지 세트**를 종합적으로 분석하여 평가해주세요.

[분석 환경 정보]
- 오늘 날짜: ${today.toISOString().split('T')[0]}
- 현재 계절: ${currentSeason} ("${seasonExpectation}" 키워드 중점 확인)

[⭐⭐ 다중 이미지 종합 평가 규칙 (매우 중요)]
여러 장의 사진을 하나의 결과로 합칠 때 다음 규칙을 엄격히 따르세요:

1. **Hygiene (청결) -> "보수적 평가 (Worst Case)"**
   - 9장이 깨끗해도 **단 1장이 비위생적(넘치는 쓰레기, 더러운 개수대 등)이라면** 그 사진을 기준으로 점수를 대폭 깎으세요.
   - **[Scoring Cap]** 화장실/개수대/샤워실 중 단 하나의 사진도 식별되지 않는다면, "검증 불가"로 간주하여 **위생 점수를 최대 70점으로 제한(Cap)**하세요.
   - 관리 상태 확인: 쓰레기가 없더라도 **'녹슨 기둥', '벗겨진 페인트', '정리되지 않은 잡풀'** 등 관리 소홀 흔적을 찾아 감점 요소에 반영하세요.

2. **Vibe (감성) -> "선별적 종합 평가 (Selective Overall)"** 
   - 단순 정보 전달용 사진(예: 배치도 그림, 메뉴판, 소화기 사용법 등)은 감성 평가 대상에서 **제외**하세요.
   - 풍경, 텐트, 인테리어를 담은 사진들의 **전반적인 평균 수준**을 평가하세요.
   - 단, 사진 간의 퀄리티 격차가 너무 심하면(예: 1장만 전문가급, 나머지는 흔들림) '일관성 부족'으로 점수를 낮추세요.

3. **Contents (콘텐츠) -> "합산 평가 (Accumulation)"**
   - **모든 사진을 통틀어** 식별 가능한 놀이 시설, 편의 서비스, 특수 사이트의 '개수'를 세어 평가하세요. (중복 제외)
   - **[🚫 Exclusion List (제외 목록)]** 다음 항목들은 절대 '콘텐츠 점수'에 포함하지 마세요 (0점 처리):
     - 기초 시설: 데크(Bare Wood), 파쇄석, 일반 잔디/흙바닥, 배전반(Electric Box), 주차장, 도로.
     - 필수 위생: 일반 개수대, 일반 화장실/샤워실, 분리수거장.
     - 개인 장비: 손님이 가져온 일반 텐트/타프, 개인용 의자/테이블, 휴대용 랜턴, 일반 휴대용 화로대/그릴.
     - 기타: 일반적인 풍경(하늘, 산, 나무), 개인 음식/주류, 일반 승용차/SUV.

---

[채점 가이드라인 (Scoring Anchors)]
**최저 30점 / 기준(중간) 60점 / 만점 100점**

1. Vibe
- Target 100: "인스타 업로드 필수." 베스트 컷의 조명과 구도가 완벽함.
- Target 60: "현실적 기록." 정보 전달 위주의 선명한 사진들.
- Target 30: 전체적으로 어둡거나 흔들려 식별 불가.

2. Hygiene - *가장 지저분한 사진 기준*
- Target 100: 모든 사진에서 칼각 텐트와 완벽한 정돈 상태 확인.
- Target 60: 생활감이 느껴지는 짐들이 보이나 위생적임.
- Target 70 (Cap): 화장실/샤워실/개수대 사진이 아예 없는 경우 (최대치).
- Target 30: 쓰레기, 곰팡이, 정돈 안 된 짐들이 한 장이라도 명확히 보임.

3. Contents 
*이미지 내에서 '시설물(트램펄린, 수영장 등)', '안내판(서비스 정책)' 등을 찾아내세요.*
- Target 100 : **4가지 이상의 확실한 차별화 요소**가 식별됨.
  (예: 트램펄린, 목장체험, 매점(특색있는), 게임기, 마술쇼 현수막, 글램핑/이지캠핑 시설, 안심취소/빠른입실 안내문 등)
- Target 60 : **1가지 이상 3가지 이하**의 즐길거리나 편의 시설이 보임.
- Target 30 : 캠핑장/숙소에 데크,파쇄석 사이트 ,화장실, 샤워실 등 기본적인 시설 외에 특별한 부대시설이나 서비스 안내가 전혀 안 보임.

4. Seasonality (계절감)
- Target 100: 사진 세트 전체에서 현재 계절(${currentSeason})의 특징이 잘 드러남.
- Target 60: 계절을 타지 않는 실내/근접 사진 위주.
- Target 30: 현재 계절과 맞지 않는 복장이나 배경이 포함됨.

### CRITICAL CONSTRAINTS:
1. 제공된 사진이 총 ${images.length}장이므로, 모든 파일명은 반드시 input_file_1부터 input_file_${images.length} 사이에서만 선택해야 합니다.
2. 존재하지 않는 파일명(예: input_file_${images.length + 1})을 절대 생성하지 마세요.
3. 절대 모든 지표를 0점이나 '내용 없음'으로 채우지 마세요. 사진의 화질이 다소 압축되어 있더라도 시각적 힌트를 찾아 최대한 성실하게 점수를 부여하세요.
4. 만약 **Hygiene 점수가 70점 제한(Cap)**에 걸렸다면, 반드시 \`hygiene\` 필드 하단에 **"위생 시설 사진이 없어, 평균 점수 70점으로 표기되었습니다."**라는 문구를 포함하세요.
5. 분석 결과는 반드시 유효한 JSON 형식이어야 합니다.

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
