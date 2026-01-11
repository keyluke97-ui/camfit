"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, BarChart3, TrendingUp, AlertTriangle, Trophy, Quote, Copy, ArrowRight } from "lucide-react";
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
    const score = totalScore;
    const isHighQuality = score >= 80;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-32">
            {/* Header Section */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100/50 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-camfit-green/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <Sparkles className="w-6 h-6 text-camfit-green animate-pulse" />
                        <h2 className="text-xl font-bold text-camfit-green tracking-wide">AI 캠핑장 성장 분석 결과</h2>
                    </div>

                    <div className="flex flex-col xl:flex-row items-start justify-between gap-12 sm:gap-16">
                        <div className="flex-1 space-y-8 w-full">
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                                {isHighQuality ? "Camfit A-Grade 인증! 🏆" : "조금만 더 다듬으면 완벽해요! 💪"}
                            </h1>

                            {/* Editor's Strategy */}
                            <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                                <div className="flex items-center gap-3 mb-5 text-emerald-800 font-bold text-xl relative z-10">
                                    <TrendingUp className="w-6 h-6" />
                                    <h3>에디터의 핵심 개선 전략</h3>
                                </div>
                                <div className="text-gray-800 leading-loose whitespace-pre-wrap text-lg font-medium relative z-10 strategy-content">
                                    {data.marketing_comment}
                                </div>
                            </div>

                            {/* One-Line Intro Recommendation */}
                            {data.one_line_intro && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-base text-gray-600 font-bold">
                                        <Copy className="w-5 h-5 text-camfit-green" />
                                        <span>추천 한줄 소개 (23자 이내)</span>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-5 rounded-2xl text-gray-800 font-bold border border-gray-200 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => { navigator.clipboard.writeText(data.one_line_intro || ""); alert("한줄 소개가 복사되었습니다!"); }}>
                                        <span className="text-lg">{data.one_line_intro}</span>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                            <Copy className="w-4 h-4" />
                                            복사하기
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Total Score Gauge - Increased spacing/margin to prevent overlap */}
                        <div className="flex-shrink-0 relative mt-8 xl:mt-0 self-center xl:self-start mx-auto">
                            <div className="w-64 h-64 relative flex items-center justify-center bg-white rounded-full shadow-2xl shadow-gray-100 border border-gray-50">
                                {/* Simple SVG Gauge for Viz */}
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 p-4">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f0fdf4" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#01DF82" strokeWidth="8"
                                        strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round" className="drop-shadow-md transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Score</span>
                                    <span className="text-7xl font-black text-gray-900 tracking-tighter" style={{ textShadow: "0 2px 10px rgba(1, 223, 130, 0.2)" }}>{score}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Guide Section */}
                    <div className="mt-12 pt-10 border-t border-gray-100">
                        <div className="mb-6 space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900">캠핑장 소개글을 이렇게 적어주세요!</h3>
                            <p className="text-base text-camfit-green font-medium">✨ AI가 작성한 글로 사실과 맞는지 확인 후 복사해주세요!</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl border border-gray-200 text-gray-700 leading-loose text-xl font-medium relative group cursor-pointer hover:shadow-lg transition-all shadow-sm"
                            onClick={() => { navigator.clipboard.writeText(data.description); alert("소개글이 복사되었습니다!"); }}>
                            <Quote className="w-10 h-10 text-gray-200 absolute -top-4 -left-2 bg-white rounded-full p-2 border border-gray-100" />
                            "{data.description}"
                            <div className="absolute top-6 right-6 bg-white shadow-md p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-bold text-gray-600 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0">
                                <Copy className="w-4 h-4" />
                                클릭하여 복사
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} {...metric} />
                ))}
            </div>

            {/* Photo Ranking Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold text-gray-900">베스트 포토 TOP 3</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {data.ranking.map((item, idx) => {
                        // Find matching file from the lifted state
                        const matchingFile = files.find(f => f.name === item.filename);
                        const imageUrl = matchingFile ? URL.createObjectURL(matchingFile) : null;

                        return (
                            <div key={idx} className="bg-white rounded-3xl p-5 shadow-lg shadow-gray-100 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-br-2xl z-20 shadow-lg">
                                    Rank {item.rank}
                                </div>

                                <div className="aspect-[4/3] bg-gray-100 rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative shadow-inner">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={item.filename} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="text-gray-400 text-sm text-center p-6 font-medium">
                                            {item.filename}<br />(이미지 매칭 실패)
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="secondary" className="bg-white/95 backdrop-blur text-xs font-bold px-3 py-1 shadow-md">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>

                                <p className="text-base font-medium text-gray-800 line-clamp-3 leading-relaxed">
                                    "{item.reason}"
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upsell Floating Button (Fixed to Bottom) */}
            {!isHighQuality && (
                <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
                    <button
                        onClick={() => alert("캠핏 파트너 센터 연결 예정")}
                        className="pointer-events-auto bg-[#01DF82] text-white font-bold py-5 px-10 rounded-full shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-3 text-xl ring-4 ring-white"
                    >
                        <span>캠핏에서 해결해봐요!</span>
                        <ArrowRight className="w-6 h-6 animate-pulse" />
                    </button>
                </div>
            )}
        </div>
    );
}
