"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { Sparkles, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { AnalysisReport } from "@/lib/types";
import { normalizeV2Data } from "@/lib/adapter"; // Adapter import

interface AnalysisDashboardProps {
    data: AnalysisReport | null;
    isLoading: boolean;
}

export function AnalysisDashboard({ data, isLoading }: AnalysisDashboardProps) {
    if (isLoading) {
        return (
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <div className="w-16 h-16 border-4 border-camfit-green border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="text-xl font-bold text-gray-700">AI Senior Editor가 분석 중입니다...</h3>
                <p className="text-gray-500 mt-2">Vibe, Hygiene, Contents, Season 정밀 진단 중</p>
                <div className="flex gap-2 mt-4">
                    <span className="w-2 h-2 rounded-full bg-camfit-green animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-camfit-green animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-camfit-green animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </GlassCard>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 space-y-4 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <BarChart3 className="w-16 h-16 opacity-20" />
                <p>왼쪽에서 사진을 업로드하여 AI 진단을 시작하세요</p>
            </div>
        );
    }

    // Adapt V2 data to Dashboard View Model
    const { totalScore, metrics } = normalizeV2Data(data);

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
                                {data.total_score >= 80 ? "Camfit A-Grade 인증! 🏆" : "잠재력이 보이지만, 개선이 시급합니다."}
                            </span>
                        </h2>

                        {/* Marketing Comment Highlight */}
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-emerald-800 text-sm mb-1">Editor's Strategy</p>
                                <p className="text-emerald-700 text-sm leading-relaxed font-medium">
                                    "{data.marketing_comment}"
                                </p>
                            </div>
                        </div>

                        {/* Description (SEO) */}
                        <p className="text-gray-500 text-sm leading-relaxed border-l-4 border-gray-200 pl-4 italic">
                            "{data.description}"
                        </p>
                    </div>

                    <div className="md:col-span-5 flex flex-col items-center justify-center md:justify-end gap-4">
                        <ScoreGauge score={data.total_score} />
                        {data.upsell_needed && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                전문가 컨설팅 필요 (Upsell)
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* 2. Detailed Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric: any) => (
                    <MetricCard
                        key={metric.id}
                        metricId={metric.id}
                        label={metric.label}
                        score={metric.score}
                        comment={metric.comment}
                        trend={metric.trend}
                    />
                ))}
            </div>

            {/* 3. Photo Ranking Section (New V2) */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Best Photo Ranking
                    <span className="text-xs font-normal text-gray-400 ml-2">유저 클릭을 유도할 메인 사진 후보</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.ranking.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-br-xl z-10">
                                Rank {item.rank}
                            </div>

                            {/* Placeholder for actual image if filename matched (In MVP we don't have URL map, just mocking visual placeholder or text) */}
                            <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-xs text-center p-4">
                                {item.filename}
                                <br />(이미지 미리보기)
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-camfit-green/10 text-camfit-dark text-[10px] font-bold rounded-full uppercase">
                                        {item.category}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                                    "{item.reason}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
