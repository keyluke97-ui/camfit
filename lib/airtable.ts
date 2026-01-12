import Airtable from 'airtable';
import { AnalysisReport } from './types';

// Lazy initialization to prevent build-time crashes if env vars are missing
const getBase = () => {
    const key = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!key && !baseId) return { error: "Key와 Base ID 모두 없습니다. (V7)" };
    if (!key) return { error: "AIRTABLE_API_KEY가 없습니다. (V7)" };
    if (!baseId) return { error: "AIRTABLE_BASE_ID가 없습니다. (V7)" };

    return {
        base: new Airtable({ apiKey: key }).base(baseId)
    };
};

export async function saveAnalysisResult(data: AnalysisReport) {
    const result = getBase();
    if ('error' in result) {
        console.warn("Airtable credentials failure:", result.error);
        return { success: false, error: `${result.error} (V8) Vercel 설정을 다시 확인해주세요.` };
    }
    const base = result.base;

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
        // Use the array-based creation with typecast enabled
        // We cast the base call to any to ignore complex overload resolution errors during build
        let tableName = (process.env.AIRTABLE_TABLE_NAME || '사진 진단 캠핑장 DB').trim();
        const table: any = base(tableName);

        const fields: any = {
            // [사용자 입력 정보]
            "캠핑장 이름": (data.campingName || "알 수 없는 캠핑장").trim(),
            "캠핑장 주소": (data.address || "").trim(),
            "주변레저": data.tags?.leisure || [],
            "시설": data.tags?.facility || [],
            "체험활동": data.tags?.activity || [],
            "담당 MD": data.assignedMD || "",

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
            "사진 업로드 (0/20)": (data.uploadedUrls || []).map(url => ({ url }))
        };

        const records = await table.create([{ fields }], { typecast: true });

        console.log("Airtable success: Record created with ID", records[0].getId());
        return { success: true, id: records[0].getId() };
    } catch (error: any) {
        console.error("Airtable Debug Error:", error);
        let errorMsg = error.message || "Unknown Airtable Error";

        // Extract more specifics if available
        if (error.error) errorMsg += ` (${error.error})`;
        if (error.statusCode) errorMsg += ` [Status: ${error.statusCode}]`;

        return { success: false, error: `${errorMsg} (V7-SDK)` };
    }
}
