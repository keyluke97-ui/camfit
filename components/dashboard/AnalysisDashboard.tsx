"use client";

import { useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, BarChart3, TrendingUp, AlertTriangle, Trophy, Quote, Copy, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
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
        // Handle input_file, Input_file, Imput_file (common typo)
        return text.replace(/(?:input|imput)_file_(\d+)(\.png)?/gi, "$1번째 이미지");
    };

    // Helper to render bold text from **markdown** and split into list items
    const renderStructuredText = (text: string | null | undefined) => {
        if (!text) return "";
        const sanitized = sanitizeText(text);
        if (!sanitized) return "";

        // Detect list items like 1), 2) or - 
        const lines = sanitized.split(/\n/);

        return (
            <div className="space-y-4">
                {lines.map((line, idx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return null;

                    // Check if line starts with a number like 1) or 1.
                    const isListItem = /^\d+[\)\.]/.test(trimmedLine);

                    const content = trimmedLine.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part && part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <strong key={i} className="font-extrabold text-emerald-950 bg-emerald-100/50 px-1 rounded mx-0.5">
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        return part;
                    });

                    if (isListItem) {
                        return (
                            <div key={idx} className="flex gap-3 bg-white/60 p-4 rounded-xl border border-emerald-100/50 shadow-sm transition-all hover:translate-x-1">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[11px] font-black mt-0.5">
                                    {trimmedLine.match(/^\d+/)?.[0]}
                                </span>
                                <p className="text-[15px] text-gray-800 leading-relaxed font-medium">
                                    {trimmedLine.replace(/^\d+[\)\.]\s*/, "")}
                                </p>
                            </div>
                        );
                    }

                    return (
                        <p key={idx} className="text-[17px] text-gray-900 leading-relaxed font-semibold tracking-tight px-1">
                            {content}
                        </p>
                    );
                })}
            </div>
        );
    };

    // Get Cloudinary URL for ranking images
    const getFileUrl = (filename: string | null | undefined) => {
        if (!filename || !data?.uploadedUrls) return null;

        // Extract index from filename (e.g., "input_file_3.png" → index 2)
        const match = filename.toString().match(/input_file_(\d+)/i);
        if (match && match[1]) {
            const index = parseInt(match[1]) - 1;
            return data.uploadedUrls[index] || null;
        }

        return null;
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

    const normalizedData = normalizeV2Data(data);
    const score = normalizedData.totalScore;
    const metrics = normalizedData.metrics;
    const isHighQuality = score >= 95; // Only hide for near-perfect scores

    const getScoreMessage = (s: number) => {
        if (s >= 90) return "압도적인 퀄리티! 캠핏 공식 A-Grade 인증 🏆";
        if (s >= 70) return "훌륭한 관리 상태! 조금만 더 다듬으면 완벽해요 ✨";
        if (s >= 50) return "예약 전환 가능성 포착! 핵심 이미지만 보완해볼까요? 💪";
        if (s >= 40) return "긴급 진단이 필요합니다! 즉각적인 개선이 시급해요 🚨";
        return "지금 바로 전문가의 도움을 받아보시겠어요? 🆘";
    };

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
                                {getScoreMessage(score)}
                            </h1>

                            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/40 rounded-3xl p-7 border border-emerald-100/60 shadow-inner relative overflow-hidden backdrop-blur-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Sparkles className="w-12 h-12 text-emerald-600" />
                                </div>
                                <div className="flex items-center gap-3 mb-5 text-emerald-900 font-bold text-xl">
                                    <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <h3>에디터의 핵심 개선 전략</h3>
                                </div>
                                <div className="text-gray-900 h-auto">
                                    {renderStructuredText(data.marketing_comment)}
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
                                <div className="relative w-36 h-36">
                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                        <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="44" fill="none" stroke="#01DF82" strokeWidth="10"
                                            strokeDasharray={`${score * 2.76} 276`} strokeLinecap="round" className="transition-all duration-1000 ease-out shadow-lg" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center transform rotate-90">
                                        <div className={`w-2 h-2 rounded-full absolute top-1.5 ${score > 70 ? 'bg-camfit-green' : 'bg-red-400'}`} />
                                    </div>
                                </div>
                            </div>

                            {score <= 77 && (
                                <div className="bg-emerald-950 text-white p-5 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
                                        <Trophy className="w-10 h-10 text-[#01DF82]" />
                                    </div>
                                    <div className="relative z-10 space-y-2">
                                        <h4 className="font-black text-[16px] text-[#01DF82] flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            예약률을 2배 높이는 솔루션
                                        </h4>
                                        <p className="text-[13px] opacity-90 leading-relaxed font-medium">
                                            현재 점수에서는 <strong>캠핏의 전문 컨설팅</strong>만 더해져도 <br />
                                            검색 노출량과 예약 전환율이 크게 상승할 수 있습니다.
                                        </p>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="mt-2 w-full bg-[#01DF82] text-[#1A1A1A] py-2.5 rounded-xl font-black text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                                        >
                                            무료 솔루션 신청하기
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

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
                        comment={sanitizeText(metric.comment)}
                        trend={metric.trend as "up" | "down" | "neutral"}
                        description={metric.description}
                        metricId={metric.id as any}
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

            {/* Upsell Floating Button with Low Score Emphasis */}
            {!isHighQuality && (
                <div className="fixed bottom-8 left-0 right-0 z-[60] flex justify-center px-6 pointer-events-none">
                    <div className="pointer-events-auto flex flex-col items-center gap-3 w-full max-w-md">
                        {score <= 77 && (
                            <div className="bg-black text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-xl animate-bounce flex items-center gap-1.5 border border-white/20">
                                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                                <span>캠핏의 서비스를 신청해보세요.</span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`w-full bg-[#01DF82] text-[#1A1A1A] font-black py-3 px-8 rounded-2xl shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex items-center justify-between group ring-4 ring-white relative overflow-hidden ${score <= 77 ? 'ring-offset-2 ring-emerald-500 animate-pulse-subtle' : ''
                                }`}
                        >
                            <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40" />
                            <div className="flex items-center gap-2.5 justify-center w-full">
                                <Sparkles className="w-5 h-5 text-camfit-dark" />
                                <span className="text-[18px] tracking-tighter">
                                    캠핏 전문가에게 진단받기
                                </span>
                            </div>
                            <div className="absolute right-6 flex items-center pointer-events-none">
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.95; transform: scale(0.99); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s infinite ease-in-out;
                }
            `}</style>

            <GrowthActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                recordId={(data as any).recordId || (data as any).airtable_record_id}
                vibeScore={data?.evaluation?.vibe_score}
                totalScore={data?.total_score}
            />
        </div>
    );
}
