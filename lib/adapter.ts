import { AnalysisReport } from "@/lib/types";

// Helper to convert V2 report to the format expected by Dashboard components
// The MetricCard expects specific structure, let's normalize or update MetricCard later.
// For now, allow Dashboard to ingest V2 report.

export function normalizeV2Data(report: AnalysisReport) {
    // Safety check for empty report
    if (!report) return { totalScore: 0, metrics: [] };

    // Helper to convert V2 report to the format expected by Dashboard components
    const getTrend = (text: string | undefined | null) => {
        if (!text) return "neutral";
        const normalized = text.toLowerCase();
        return normalized.includes("부족") || normalized.includes("아쉽") || normalized.includes("낮") ? "down" : "up";
    };

    // Ensure evaluation object exists
    const evaluation = report.evaluation || { vibe: "", hygiene: "", contents: "", season: "" };

    // [New Formula V13] Weighted scoring: Vibe(35%), Hygiene(25%), Contents(25%), Season(15%)
    const vScore = evaluation.vibe_score || 0;
    const hScore = evaluation.hygiene_score || 0;
    const cScore = evaluation.contents_score || 0;
    const sScore = evaluation.season_score || 0;

    const weightedScore = (vScore * 0.35) + (hScore * 0.25) + (cScore * 0.25) + (sScore * 0.15);

    return {
        totalScore: Math.round(weightedScore),
        metrics: [
            {
                id: "vibe",
                label: "비주얼 경쟁력",
                score: evaluation.vibe_score || 0,
                comment: evaluation.vibe || "평가내용 없음",
                trend: getTrend(evaluation.vibe) as "up" | "down" | "neutral",
                description: "페이지 접속 시 고객의 시선을 얼마나 사로잡는지 보여줍니다."
            },
            {
                id: "hygiene",
                label: "청결 안심 지수",
                score: evaluation.hygiene_score || 0,
                comment: evaluation.hygiene || "평가내용 없음",
                trend: getTrend(evaluation.hygiene) as "up" | "down" | "neutral",
                description: "사진을 통해 전달되는 청결함을 보여줍니다."
            },
            {
                id: "contents",
                label: "콘텐츠 매력도",
                score: evaluation.contents_score || 0,
                comment: evaluation.contents || "평가내용 없음",
                trend: getTrend(evaluation.contents) as "up" | "down" | "neutral",
                description: "숙소의 매력적이고, 다양한 콘텐츠가 있는지 판단합니다."
            },
            {
                id: "season",
                label: "계절감",
                score: evaluation.season_score || 0,
                comment: evaluation.season || "평가내용 없음",
                trend: getTrend(evaluation.season) as "up" | "down" | "neutral",
                description: "시기별 썸네일 전략 등 마케팅 효율성을 나타냅니다."
            },
        ]
    };
}
