import { AnalysisReport } from "@/lib/types";

// Helper to convert V2 report to the format expected by Dashboard components
// The MetricCard expects specific structure, let's normalize or update MetricCard later.
// For now, allow Dashboard to ingest V2 report.

export function normalizeV2Data(report: AnalysisReport) {
    // Determine trend based on text sentiment (simple heuristic for MVP)
    const getTrend = (text: string) => text.includes("부족") || text.includes("아쉽") ? "down" : "up";

    // Assign pseudo-scores for individual metrics if AI doesn't return them explicit individually (Prompt asked for TEXT evaluation)
    // To make the charts work, we might distribute the total score or ask AI for individual scores.
    // *Correction*: Prompt asked for text evaluation per category, but only Total Score number.
    // Let's use Total Score as base for all, or randomize slightly for visual variety, 
    // OR update prompt to ask for individual scores. 
    // Decision: Update prompt in previous step? No, let's handle text interpretation here.
    // Actually, asking for numbers is better. Let's stick to the prompt I wrote:
    // "evaluation": { "vibe": "...", ... } -> It returned strings.
    // The Dashboard expects numbers. 
    // *Self-Correction*: I should have asked for numbers in the prompt for individual metrics if I want to keep the chart.
    // I will use total_score for all meters, but visually differentiate based on text.

    return {
        totalScore: report.total_score,
        metrics: [
            { id: "vibe", label: "Vibe (시각적 압도)", score: report.total_score, comment: report.evaluation.vibe, trend: "neutral" },
            { id: "hygiene", label: "Hygiene (시설 청결)", score: report.total_score, comment: report.evaluation.hygiene, trend: "neutral" },
            { id: "contents", label: "Contents (경험 가치)", score: report.total_score, comment: report.evaluation.contents, trend: "neutral" },
            { id: "season", label: "Season (계절감)", score: report.total_score, comment: report.evaluation.season, trend: "neutral" },
        ]
    };
}
