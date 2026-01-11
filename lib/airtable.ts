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

    const getBestUrl = (rank: number) => {
        const item = data.ranking?.find(r => r.rank === rank);
        if (!item) return [];
        const match = item.filename?.match(/input_file_(\d+)/i);
        if (match && match[1]) {
            const idx = parseInt(match[1]) - 1;
            const url = data.uploadedUrls?.[idx];
            return url ? [{ url }] : [];
        }
        return [];
    };

    try {
        // Prepare fields with explicit casting to bypass strict type checking for custom field names
        const fields: any = {
            // [사용자 입력 정보]
            "캠핑장 이름": (data.campingName || "알 수 없는 캠핑장").trim(),
            "캠핑장 주소": (data.address || "").trim(),
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

            // [사진 데이터] - Now sending as attachments
            "BEST 1 사진": getBestUrl(1),
            "BEST 2 사진": getBestUrl(2),
            "BEST 3 사진": getBestUrl(3),
            "사진 업로드 (0/20)": (data.uploadedUrls || []).map(url => ({ url })),

            // Technical metadata
            "Full JSON": JSON.stringify(data),
            "Created At": new Date().toISOString()
        };

        // Use the array-based creation with typecast enabled
        // We cast the base call to any to ignore complex overload resolution errors during build
        const tableName = process.env.AIRTABLE_TABLE_NAME || '사진 진단 캠핑장 DB';
        const table: any = base(tableName);
        const records = await table.create([{ fields }], { typecast: true });

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
