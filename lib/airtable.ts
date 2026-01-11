import Airtable from 'airtable';
import { AnalysisReport } from './types';

// Lazy initialization to prevent build-time crashes if env vars are missing
const getBase = () => {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return null;
    }
    return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
        process.env.AIRTABLE_BASE_ID
    );
};

export async function saveAnalysisResult(data: AnalysisReport) {
    const base = getBase();
    if (!base) {
        console.warn("Airtable credentials missing. Skipping save.");
        return null;
    }

    try {
        const records = await base(process.env.AIRTABLE_TABLE_NAME || '사진 진단 캠핑장 DB').create([
            {
                fields: {
                    // [사용자 입력 정보]
                    "캠핑장 이름": (data.campingName || "알 수 없는 캠핑장").trim(),
                    "캠핑장 주소 (신규)": (data.address || "").trim(),
                    "주변레저": JSON.stringify(data.tags?.leisure || []),
                    "시설": JSON.stringify(data.tags?.facility || []),
                    "체험활동": JSON.stringify(data.tags?.activity || []),

                    // [AI 분석 결과 데이터]
                    "종합 점수": Math.round(data.total_score || 0),
                    "비주얼 경쟁력": data.evaluation?.vibe_score || 0,
                    "청결 안심 지수": data.evaluation?.hygiene_score || 0,
                    "콘텐츠 매력도": data.evaluation?.contents_score || 0,
                    "계절감": data.evaluation?.season_score || 0,

                    "에디터 핵심 전략": data.marketing_comment || "",
                    "추천 한 줄 소개": (data.one_line_intro || "").trim(),
                    "추천 소개글 가이드": data.description || "",

                    // [베스트 포토 데이터] - Metadata focusing on reasons
                    "BEST 1 선정이유": data.ranking?.find(r => r.rank === 1)?.reason || "",
                    "BEST 2 선정이유": data.ranking?.find(r => r.rank === 2)?.reason || "",
                    "BEST 3 선정이유": data.ranking?.find(r => r.rank === 3)?.reason || "",

                    // Technical metadata
                    "Full JSON": JSON.stringify(data),
                    "Created At": new Date().toISOString()
                }
            }
        ]);
        console.log("Airtable success: Record created with ID", records[0].getId());
        return records[0].getId();
    } catch (error: any) {
        console.error("Critical Airtable Error Details:", {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error,
            details: error.details
        });
        return null;
    }
}
