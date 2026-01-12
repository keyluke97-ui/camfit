import { AnalysisReport } from "@/lib/types";

// Helper to convert V2 report to the format expected by Dashboard components
// The MetricCard expects specific structure, let's normalize or update MetricCard later.
// For now, allow Dashboard to ingest V2 report.

export function normalizeV2Data(report: AnalysisReport) {
    // Determine trend based on text sentiment (simple heuristic for MVP)
    const getTrend = (text: string) => text.includes("부족") || text.includes("아쉽") || text.includes("낮") ? "down" : "up";

    return {
        totalScore: Math.round(report.total_score),
        metrics: [
            {
                id: "vibe",
                label: "비주얼 경쟁력",
                score: report.evaluation.vibe_score || 0,
                comment: report.evaluation.vibe,
                trend: getTrend(report.evaluation.vibe) as "up" | "down" | "neutral",
                description: "페이지 접속 시 고객의 시선을 얼마나 사로잡는지 보여줍니다."
            },
            {
                id: "hygiene",
                label: "청결 안심 지수",
                score: report.evaluation.hygiene_score || 0,
                comment: report.evaluation.hygiene,
                trend: getTrend(report.evaluation.hygiene) as "up" | "down" | "neutral",
                description: "사진을 통해 전달되는 청결함을 보여줍니다."
            },
            {
                id: "contents",
                label: "콘텐츠 매력도",
                score: report.evaluation.contents_score || 0,
                comment: report.evaluation.contents,
                trend: getTrend(report.evaluation.contents) as "up" | "down" | "neutral",
                description: "부대시설과 편의 시설의 상품 가치를 표현합니다."
            },
            {
                id: "season",
                label: "계절감",
                score: report.evaluation.season_score || 0,
                comment: report.evaluation.season,
                trend: getTrend(report.evaluation.season) as "up" | "down" | "neutral",
                description: "시기별 썸네일 전략 등 마케팅 효율성을 나타냅니다."
            },
        ]
    };
}
