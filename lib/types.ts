export interface AnalyzedMetric {
    score: number;
    comment: string;
    trend: "up" | "down" | "neutral";
}

export interface PhotoRanking {
    rank: number;
    filename: string; // or ID/URL
    category: "Main" | "Facility" | "Activity" | "Season";
    reason?: string; // Optional - not stored in Airtable
    url?: string; // Direct URL from Airtable attachment
}

export interface AnalysisEvaluation {
    vibe: string;
    vibe_score?: number;
    hygiene: string;
    hygiene_score?: number;
    contents: string;
    contents_score?: number;
    season: string;
    season_score?: number;
}

export interface AnalysisReport {
    total_score: number;
    evaluation: AnalysisEvaluation;
    ranking?: PhotoRanking[];
    marketing_comment: string;
    upsell_needed?: boolean;
    description: string;
    one_line_intro?: string;
    address?: string; // New V2 context
    // Metadata to save context
    campingName?: string;
    tags?: {
        leisure: string[];
        facility: string[];
        activity: string[];
    };
    photoCount?: number;
    uploadedUrls?: string[]; // All Vercel Blob URLs
    airtable_record_id?: string;
    // For internal tracking of the ID itself when fetched back
    recordId?: string;
    airtable_sync_failed?: boolean;
}
