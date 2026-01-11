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
    files?: File[]; // Optional files for preview matching
}

export function AnalysisDashboard({ data, isLoading, files = [] }: AnalysisDashboardProps) {
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
            <div className="space-y-8 animate-in fade-in duration-700 pb-24"> {/* Added pb-24 for floating button space */}
                {/* Header Section */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100/50 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-camfit-green/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-6 h-6 text-camfit-green animate-pulse" />
                            <h2 className="text-xl font-bold text-camfit-green tracking-wide">AI 캠핑장 성장 분석 결과</h2>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="flex-1 space-y-6">
                                <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                                    {isHighQuality ? "Camfit A-Grade 인증! 🏆" : "조금만 더 다듬으면 완벽해요! 💪"}
                                </h1>

                                {/* Editor's Strategy */}
                                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-lg">
                                        <TrendingUp className="w-5 h-5" />
                                        <h3>에디터의 핵심 개선 전략</h3>
                                    </div>
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                        {data.marketing_comment}
                                    </div>
                                </div>

                                {/* One-Line Intro Recommendation */}
                                {data.one_line_intro && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                            <Copy className="w-4 h-4" />
                                            <span>추천 한줄 소개 (23자 이내)</span>
                                        </div>
                                        <div className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800 font-bold border border-gray-200 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => { navigator.clipboard.writeText(data.one_line_intro || ""); alert("한줄 소개가 복사되었습니다!"); }}>
                                            <span>{data.one_line_intro}</span>
                                            <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Total Score Gauge - Fixed Overlap */}
                            <div className="flex-shrink-0 relative mt-4 md:mt-0"> {/* Added margin top just in case on mobile */}
                                <div className="w-56 h-56 relative flex items-center justify-center">
                                    {/* Simple SVG Gauge for Viz */}
                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#01DF82" strokeWidth="10"
                                            strokeDasharray={`${score * 2.83} 283`} strokeLinecap="round" className="drop-shadow-lg transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Score</span>
                                        <span className="text-6xl font-black text-gray-900 tracking-tighter">{score}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Guide Section */}
                        <div className="mt-10 pt-8 border-t border-gray-100">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900">캠핑장 소개글을 이렇게 적어주세요!</h3>
                                <p className="text-sm text-camfit-green mt-1">✨ AI가 작성한 글로 사실과 맞는지 확인 후 복사해주세요!</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-gray-700 leading-loose text-lg font-medium relative group cursor-pointer hover:bg-gray-100 transition-all shadow-inner"
                                onClick={() => { navigator.clipboard.writeText(data.description); alert("소개글이 복사되었습니다!"); }}>
                                <Quote className="w-8 h-8 text-gray-300 absolute -top-3 -left-2 bg-white rounded-full p-1" />
                                "{data.description}"
                                <div className="absolute top-4 right-4 bg-white/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-gray-500 shadow-sm">
                                    클릭하여 복사
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {normalizedMetrics.map((metric: any) => (
                        <MetricCard key={metric.id} {...metric} />
                    ))}
                </div>

                {/* Photo Ranking Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <h3 className="text-xl font-bold text-gray-900">베스트 포토 TOP 3</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {data.ranking.map((item: any, idx: number) => {
                            // Find matching file from the lifted state
                            const matchingFile = files.find(f => f.name === item.filename);
                            const imageUrl = matchingFile ? URL.createObjectURL(matchingFile) : null;

                            return (
                                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-br-xl z-20 shadow-md">
                                        Rank {item.rank}
                                    </div>

                                    <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={item.filename} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-400 text-xs text-center p-4">
                                                {item.filename}<br />(이미지 매칭 실패)
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs shadow-sm">
                                                {item.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                        "{item.reason}"
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            );
}
