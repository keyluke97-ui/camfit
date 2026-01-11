"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { PhotoGallery } from "@/components/dashboard/PhotoGallery";
import { Sparkles, BarChart3 } from "lucide-react";
import { AnalysisResult } from "@/lib/mockData";

interface AnalysisDashboardProps {
    data: AnalysisResult | null;
    isLoading: boolean;
}

export function AnalysisDashboard({ data, isLoading }: AnalysisDashboardProps) {
    if (isLoading) {
        return (
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <div className="w-16 h-16 border-4 border-camfit-green border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="text-xl font-bold text-gray-700">AI가 사진을 분석하고 있습니다</h3>
                <p className="text-gray-500 mt-2">약 5-10초 정도 소요됩니다...</p>
            </GlassCard>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 space-y-4 border-2 border-dashed border-gray-200 rounded-3xl">
                <BarChart3 className="w-16 h-16 opacity-20" />
                <p>왼쪽에서 사진을 업로드하여 분석을 시작하세요</p>
            </div>
        );
    }

    const { totalScore, metrics } = data;

    // Convert map/object structure from API if needed, handling the mock structure match
    // The API returns { vibe: {...}, ... } but mockData interface expects array. 
    // Let's adapt if needed or ensure API matches. 
    // For safety, let's normalize here assuming API returns object keys.
    const normalizedMetrics = Array.isArray(metrics) ? metrics : [
        { id: "vibe", label: "Vibe (시각적 압도)", ...metrics.vibe },
        { id: "hygiene", label: "Hygiene (시설 청결)", ...metrics.hygiene },
        { id: "contents", label: "Contents (경험 가치)", ...metrics.contents },
        { id: "season", label: "Season (계절감)", ...metrics.season },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* 1. Header & Overall Score */}
            <GlassCard className="relative overflow-hidden border-camfit-green/20 box-shadow-glow">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-camfit-green/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                        <div className="flex items-center gap-2 text-camfit-green font-bold text-sm tracking-wider uppercase">
                            <Sparkles className="w-4 h-4" />
                            AI Growth Analysis Result
                        </div>
                        <h2 className="text-3xl font-bold text-camfit-dark">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-camfit-green to-emerald-600">
                                {totalScore > 80 ? "탁월한 경쟁력입니다!" : "성장 잠재력이 발견되었습니다."}
                            </span>
                        </h2>
                        <p className="text-gray-500 leading-relaxed">
                            {totalScore > 80
                                ? "전반적인 시설과 분위기가 매우 우수합니다. 현재의 강점을 유지하며 계절별 콘텐츠를 보강한다면 지역 1위 캠핑장이 될 수 있습니다."
                                : "기본적인 시설 관리는 양호하나, Z세대에게 어필할 'Vibe' 요소가 20% 부족합니다. 조명과 소품을 활용한 포토존 설치를 추천합니다."}
                        </p>
                    </div>

                    <div className="md:col-span-5 flex justify-center md:justify-end">
                        <ScoreGauge score={totalScore} />
                    </div>
                </div>
            </GlassCard>

            {/* 2. Detailed Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {normalizedMetrics.map((metric: any) => (
                    <MetricCard
                        key={metric.id}
                        metricId={metric.id}
                        label={metric.label || metric.id} // Fallback
                        score={metric.score}
                        comment={metric.comment}
                        trend={metric.trend}
                    />
                ))}
            </div>

            {/* 3. Photo Ranking (Mocked for now as we only upload 1 image in this flow, but visual is maintained) */}
            <PhotoGallery />

        </div>
    );
}
