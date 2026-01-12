"use client";

import { useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, BarChart3, TrendingUp, AlertTriangle, Trophy, Quote, Copy, ArrowRight, CircleAlert, CheckCircle2 } from "lucide-react";
import { AnalysisReport } from "@/lib/types";
import { normalizeV2Data } from "@/lib/adapter"; // Adapter import
import { GrowthActionModal } from "@/components/dashboard/GrowthActionModal";

interface AnalysisDashboardProps {
    data: AnalysisReport | null;
    isLoading: boolean;
    files?: File[]; // Optional files for preview matching
}

export function AnalysisDashboard({ data, isLoading, files = [] }: AnalysisDashboardProps) {
    const [expandedRankings, setExpandedRankings] = useState<number[]>([]);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleRanking = (idx: number) => {
        setExpandedRankings((prev: number[]) =>
            prev.includes(idx) ? prev.filter((i: number) => i !== idx) : [...prev, idx]
        );
    };

    const toggleDescription = () => {
        setIsDescriptionExpanded((prev: boolean) => !prev);
    };

    // Helper to sanitize technical IDs like input_file_1 into 1번째 이미지
    const sanitizeText = (text: string) => {
        if (!text) return text;
        return text.replace(/input_file_(\d+)(\.png)?/gi, "$1번째 이미지");
    };

    // Helper to render bold text from **markdown**
    const renderBoldText = (text: string) => {
        const sanitized = sanitizeText(text);
        const parts = sanitized.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-extrabold text-gray-950 underline decoration-camfit-green/30 decoration-4 underline-offset-2">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Robust image matching
    const getFileUrl = (filename: string) => {
        if (!filename) return null;
        const normalized = filename.toLowerCase().trim();

        // 1. Match by index-based identifier (e.g., input_file_1.png)
        const match = normalized.match(/input_file_(\d+)/i);
        if (match && match[1]) {
            const index = parseInt(match[1]) - 1;
            if (files[index]) {
                return URL.createObjectURL(files[index]);
            }
        }

        // 2. Fallback: Match by original filename
        const matchingFile = files.find(f => {
            const fName = f.name.toLowerCase().trim();
            return fName === normalized || fName.split('.')[0] === normalized.split('.')[0];
        });
        return matchingFile ? URL.createObjectURL(matchingFile) : null;
    };

    if (isLoading) {
        return (
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-camfit-green border-t-transparent rounded-full animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-gray-700">AI가 캠핑장을 정밀 분석 중입니다 (약 1분 소요)...</h3>
                    <p className="text-gray-500 mt-2">비주얼, 청결, 콘텐츠, 계절감 정밀 진단 중</p>
                    <div className="flex gap-2 mt-4">
                        <span className="w-2 h-2 rounded-full bg-camfit-green animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 rounded-full bg-camfit-green animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 rounded-full bg-camfit-green animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
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
    const normalizedData = normalizeV2Data(data);
    const score = normalizedData.totalScore;
    const metrics = normalizedData.metrics;
    const isHighQuality = score >= 80;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-32">
            {/* Header Section - 2 Column for PC */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-camfit-green/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-5 h-5 text-camfit-green animate-pulse" />
                        <h2 className="text-lg font-bold text-camfit-green tracking-wide">AI 캠핑장 성장 분석 결과 (V13)</h2>
                    </div>

                    {(data as any).airtable_sync_failed && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in slide-in-from-top duration-500">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-camfit-green" />
                            <p className="text-xs font-medium">분석 데이터가 곧 캠핏 파트너 시스템과 동기화될 예정입니다.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Strategy Column */}
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 leading-tight">
                                {isHighQuality ? "Camfit A-Grade 인증! 🏆" : "조금만 더 다듬으면 완벽해요! 💪"}
                            </h1>

                            <div className="bg-emerald-50/40 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-4 text-emerald-900 font-bold text-lg">
                                    <TrendingUp className="w-5 h-5" />
                                    <h3>에디터의 핵심 개선 전략</h3>
                                </div>
                                <div className="text-gray-900 leading-relaxed whitespace-pre-wrap text-[17px] font-medium tracking-tight h-auto">
                                    {renderBoldText(data.marketing_comment)}
                                </div>
                            </div>
                        </div>

                        {/* Scores Column */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-500">종합 점수</span>
                                    <span className="text-6xl font-black text-gray-950 tracking-tighter">{score}</span>
                                </div>
                                <div className="relative w-32 h-32">
                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                        <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="44" fill="none" stroke="#01DF82" strokeWidth="10"
                                            strokeDasharray={`${score * 2.76} 276`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {metrics.map((m) => (
                                    <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="text-[14px] font-bold text-gray-900">{m.label}</div>
                                            <div className="text-[11px] text-gray-400 font-medium">{m.description}</div>
                                        </div>
                                        <div className="flex items-end gap-1 mt-2">
                                            <span className="text-2xl font-black text-gray-900">{m.score}</span>
                                            <span className="text-[11px] text-gray-400 font-bold pb-1">/100</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="my-8 border-t border-gray-100" />

                    {/* Copy Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* One-Line Intro */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[15px] text-gray-700 font-bold">
                                <Copy className="w-4 h-4 text-camfit-green" />
                                <span>추천 한줄 소개</span>
                            </div>
                            <div className="bg-gray-50/80 px-4 py-4 rounded-xl text-gray-900 font-bold border border-gray-200 cursor-pointer hover:bg-white transition-all group h-auto min-h-[80px] flex items-center"
                                onClick={() => { navigator.clipboard.writeText(sanitizeText(data.one_line_intro || "")); alert("복사되었습니다!"); }}>
                                <p className="text-[16px]">{sanitizeText(data.one_line_intro || "")}</p>
                            </div>
                        </div>

                        {/* Full Description */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[15px] text-gray-700 font-bold">
                                    <Sparkles className="w-4 h-4 text-camfit-green" />
                                    <span>추천 소개글 가이드</span>
                                </div>
                                <span className="text-[11px] text-camfit-green font-bold bg-camfit-green/10 px-2 py-0.5 rounded-full">✨ 클릭하여 전체보기</span>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-white px-5 py-4 rounded-xl text-gray-800 font-medium border border-gray-200 cursor-pointer hover:shadow-md transition-all relative group h-auto min-h-[80px]"
                                onClick={() => toggleDescription()}>
                                <p className={`text-[15px] leading-relaxed italic ${isDescriptionExpanded ? "" : "line-clamp-3"}`}>"{sanitizeText(data.description)}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Breakdown Grid (Full Detail) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric) => (
                    <MetricCard
                        key={metric.id}
                        label={metric.label}
                        score={metric.score}
                        comment={metric.comment}
                        trend={metric.trend}
                        description={metric.description}
                    />
                ))}
            </div>

            <div className="my-6 border-b border-gray-100" />

            {/* Photo Ranking Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-bold text-gray-900">베스트 포토 TOP 3</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(data?.ranking || []).map((item, idx) => {
                        const imageUrl = getFileUrl(item.filename);

                        return (
                            <div key={idx} className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                {/* Glass Rank Badge */}
                                <div className="absolute top-3 left-3 bg-[#01DF82] text-white text-xs font-black px-3 py-1.5 rounded-full z-20 shadow-lg shadow-green-500/30">
                                    RANK {item.rank}
                                </div>

                                <div className="aspect-[4/3] bg-gray-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative shadow-inner">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={item.filename} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="bg-gray-50 w-full h-full flex flex-col items-center justify-center text-gray-300 p-4">
                                            <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                                            <span className="text-[10px] text-center font-medium">
                                                {item.filename?.match(/input_file_(\d+)/i)
                                                    ? `${item.filename.match(/input_file_(\d+)/i)![1]}번째 이미지`
                                                    : (item.filename || "매칭 실패")}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2">
                                        <Badge variant="neutral" className="bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 shadow-sm text-gray-700">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>

                                <p
                                    onClick={() => toggleRanking(idx)}
                                    className={`text-[15px] font-bold text-gray-900 leading-snug mb-1 cursor-pointer hover:text-camfit-green transition-colors ${expandedRankings.includes(idx) ? "" : "line-clamp-2"
                                        }`}
                                    title="전체 보기"
                                >
                                    "{item.reason}"
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upsell Floating Button */}
            {!isHighQuality && (
                <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="pointer-events-auto bg-[#01DF82] text-white font-black py-4 px-10 rounded-full shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-3 text-[19px] ring-4 ring-white"
                    >
                        <span>캠핏에서 해결해봐요!</span>
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            )}

            <GrowthActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                recordId={(data as any).airtable_record_id}
            />
        </div>
    );
}
