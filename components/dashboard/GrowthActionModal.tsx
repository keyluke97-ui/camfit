"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { X, Camera, Sparkles, Star, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";

interface GrowthActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId?: string;
}

export function GrowthActionModal({ isOpen, onClose, recordId }: GrowthActionModalProps) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAction = async (actionId: string, fields: Record<string, boolean>, successMessage: string) => {
        if (!recordId) {
            alert("오류: 레코드 ID가 없습니다. 페이지를 새로고침 해주세요.");
            return;
        }

        setLoadingAction(actionId);

        try {
            const response = await fetch('/api/airtable/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordId, fields })
            });

            if (!response.ok) throw new Error("Update failed");

            alert(successMessage);
        } catch (error) {
            console.error("Action Error:", error);
            alert("처리 중 오류가 발생했습니다.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <GlassCard className="w-full max-w-2xl relative z-60 animate-in zoom-in-95 duration-200 p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-camfit-green p-6 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">캠핏 사장님 전용 성장 솔루션</h2>
                            <p className="text-white/80 text-xs font-medium">원하시는 항목을 선택하면 담당자가 확인 후 연락드립니다.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">

                    {/* 1. Photo Upgrade */}
                    <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                                <Camera className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">사진 퀄리티를 높이고 싶어요</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => window.open('https://smore.im/form/V0zsSirSAM', '_blank')}
                                className="bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
                            >
                                <span>📷 전문가 촬영 신청</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={() => handleAction('photo_contest', { '사진공모전_참여': true }, "사진 공모전 참여가 접수되었습니다!")}
                                disabled={loadingAction === 'photo_contest'}
                                className="bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                <span>🏆 사진 공모전 참여</span>
                                {loadingAction === 'photo_contest' ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />}
                            </button>
                        </div>
                    </div>

                    {/* 2. Promotion */}
                    <button
                        onClick={() => handleAction('promotion', { '기획전_신청': true }, "기획전 참여 신청이 완료되었습니다!")}
                        disabled={loadingAction === 'promotion'}
                        className="w-full border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-colors text-left flex items-center justify-between bg-white hover:bg-gray-50 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">캠핏 메인 기획전에 참여하고 싶어요</h3>
                        </div>
                        {loadingAction === 'promotion' ? <span className="animate-spin text-gray-400">⏳</span> : <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500" />}
                    </button>

                    {/* 3. Competitiveness */}
                    <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
                                <Star className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">우리 캠핑장만의 경쟁력을 갖고 싶어요</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => handleAction('cancel_service', { '안심취소_신청': true }, "안심취소 서비스 상담이 접수되었습니다!")}
                                disabled={loadingAction === 'cancel_service'}
                                className="bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                <span>🛡️ 안심취소 서비스</span>
                                {loadingAction === 'cancel_service' ? <span className="animate-spin">⏳</span> : null}
                            </button>
                            <button
                                onClick={() => handleAction('easy_camping', { '이지캠핑_신청': true }, "이지캠핑 도입 상담이 접수되었습니다!")}
                                disabled={loadingAction === 'easy_camping'}
                                className="bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                <span>⛺ 이지캠핑 도입</span>
                                {loadingAction === 'easy_camping' ? <span className="animate-spin">⏳</span> : null}
                            </button>
                        </div>
                    </div>

                    {/* 4. Booking Rate */}
                    <button
                        onClick={() => {
                            handleAction('coupon', { '쿠폰 할인 긍정': true }, "쿠폰 발행 의사가 전달되었습니다! 파트너 센터로 연결합니다.");
                            setTimeout(() => {
                                window.open('https://partner.camfit.co.kr', '_blank');
                            }, 1000);
                        }}
                        disabled={loadingAction === 'coupon'}
                        className="w-full border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-colors text-left flex items-center justify-between bg-white hover:bg-gray-50 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-xl text-red-600">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">점수는 높은데 예약률이 아쉬워요</h3>
                        </div>
                        {loadingAction === 'coupon' ? <span className="animate-spin text-gray-400">⏳</span> : <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-500" />}
                    </button>
                </div>

                <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 font-medium">
                    Camfit Partner Success Team
                </div>
            </GlassCard>
        </div>
    );
}
