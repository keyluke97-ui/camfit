export interface AnalyzedMetric {
    score: number;
    comment: string;
    trend: "up" | "down" | "neutral";
}

export interface PhotoRanking {
    rank: number;
    filename: string; // or ID/URL
    category: "Main" | "Facility" | "Activity" | "Season";
    reason: string;
}

export interface AnalysisEvaluation {
    vibe: string;
    hygiene: string;
    contents: string;
    season: string;
}

export interface AnalysisReport {
    total_score: number;
    evaluation: AnalysisEvaluation;
    ranking: PhotoRanking[];
    marketing_comment: string;
    upsell_needed: boolean;
    description: string;
    one_line_intro?: string; // New V2 Feature
    // Metadata to save context
    campingName?: string;
    tags?: {
        leisure: string[];
        facility: string[];
        activity: string[];
    };
    photoCount?: number;
}
