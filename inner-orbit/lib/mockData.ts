export type AnalysisMetric = "vibe" | "hygiene" | "contents" | "season";

export interface AnalysisResult {
    totalScore: number;
    metrics: {
        id: AnalysisMetric;
        label: string;
        score: number;
        comment: string;
        trend: "up" | "down" | "neutral";
    }[];
    photos: {
        id: string;
        url: string; // Placeholder or Unsplash
        rank: number;
        reason: string;
        tags: string[];
    }[];
}

export const MOCK_ANALYSIS: AnalysisResult = {
    totalScore: 84,
    metrics: [
        {
            id: "vibe",
            label: "Vibe (시각적 압도)",
            score: 92,
            comment: "노을이 질 때의 텐트 풍경이 매우 감성적입니다.",
            trend: "up",
        },
        {
            id: "hygiene",
            label: "Hygiene (시설 청결)",
            score: 78,
            comment: "개수대 주변 정돈 상태가 아쉽습니다.",
            trend: "neutral",
        },
        {
            id: "contents",
            label: "Contents (경험 가치)",
            score: 88,
            comment: "불멍 구역과 아이들 놀이 시설이 잘 갖춰져 있습니다.",
            trend: "up",
        },
        {
            id: "season",
            label: "Season (계절감)",
            score: 80,
            comment: "가을 단풍이 잘 드러나지만, 겨울 이미지가 부족합니다.",
            trend: "down",
        },
    ],
    photos: [
        {
            id: "p1",
            url: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800",
            rank: 1,
            reason: "압도적인 자연광과 텐트의 조화",
            tags: ["Main", "Emotional"],
        },
        {
            id: "p2",
            url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800",
            rank: 2,
            reason: "가족 단위 활동성이 잘 드러남",
            tags: ["Activity", "Family"],
        },
        {
            id: "p3",
            url: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&q=80&w=800",
            rank: 3,
            reason: "깔끔한 시설 전경",
            tags: ["Facility", "Clean"],
        },
    ],
};
