import { AnalysisReport } from "@/lib/types";

// Helper to convert V2 report to the format expected by Dashboard components
// The MetricCard expects specific structure, let's normalize or update MetricCard later.
// For now, allow Dashboard to ingest V2 report.

export function normalizeV2Data(report: AnalysisReport) {
    // Determine trend based on text sentiment (simple heuristic for MVP)
    const getTrend = (text: string) => text.includes("부족") || text.includes("아쉽") || text.includes("낮") ? "down" : "up";

    // Helper to generate a realistic variance from the total score (-5 to +5)
    // Ensures score stays within 0-100 range
    const getVariedScore = (base: number) => {
        const variance = Math.floor(Math.random() * 11) - 5; // -5 ~ +5
        return Math.min(100, Math.max(0, base + variance));
    };

    return {
        totalScore: report.total_score,
        metrics: [
            { id: "vibe", label: "시각적 압도", score: getVariedScore(report.total_score), comment: report.evaluation.vibe, trend: getTrend(report.evaluation.vibe) as "up" | "down" | "neutral" },
            { id: "hygiene", label: "시설 청결", score: getVariedScore(report.total_score), comment: report.evaluation.hygiene, trend: getTrend(report.evaluation.hygiene) as "up" | "down" | "neutral" },
            { id: "contents", label: "경험 가치", score: getVariedScore(report.total_score), comment: report.evaluation.contents, trend: getTrend(report.evaluation.contents) as "up" | "down" | "neutral" },
            { id: "season", label: "계절감", score: getVariedScore(report.total_score), comment: report.evaluation.season, trend: getTrend(report.evaluation.season) as "up" | "down" | "neutral" },
        ]
    };
}
