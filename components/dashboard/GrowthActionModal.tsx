"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { X, Camera, Sparkles, Star, TrendingDown, CheckCircle2, ArrowRight, Zap, Award, Loader2 } from "lucide-react";

interface GrowthActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId?: string;
    vibeScore?: number;
    totalScore?: number;
}

interface ServiceDetail {
    id: string;
    title: string;
    description: string;
    benefits: string[];
    cta: string;
    field?: string;
    externalLink?: string;
}

const SERVICES: Record<string, ServiceDetail> = {
    photographer: {
        id: 'photographer',
        title: '전문 사진가 신청',
        description: '2박 숙박권 + 촬영비 비딩으로 시중가보다 30% 저렴하게 전문가를 매칭해 드립니다.',
        benefits: [
            '시중가 대비 30% 절감',
            '캠핏 검증 전문가 매칭',
            '고퀄리티 원본 파일 제공'
        ],
        cta: '전문가 매칭 신청하기',
        field: '전문가 사진 신청'
    },
    influencer: {
        id: 'influencer',
        title: '인플루언서/체험단 마케팅',
        description: '비용 부담 제로! 2박 숙박권 제공 시 캠핏 파워 인플루언서 매칭 및 SNS 홍보를 도와드립니다.',
        benefits: [
            '초기 비용 0원 (숙박권만 제공)',
            '캠핏 파워 인플루언서 매칭',
            '리뷰 콘텐츠 2차 활용 가능'
        ],
        cta: '인플루언서 매칭 신청',
        externalLink: 'https://smore.im/form/V0zsSirSAM'
    },
    photo_contest: {
        id: 'photo_contest',
        title: '사진 공모전 참여',
        description: '유저들이 직접 찍은 고퀄리티 홍보 사진을 확보할 기회! 별도 큐레이션 홍보 혜택 제공.',
        benefits: [
            '유저 참여형 마케팅',
            '캠핏 메인 큐레이션 노출',
            '커뮤니티 활성화 효과'
        ],
        cta: '공모전 참여 신청',
        field: '사진공모전_참여'
    },
    safe_cancel: {
        id: 'safe_cancel',
        title: '안심취소 서비스',
        description: '취소 수수료 분쟁 끝! 고객이 취소해도 사장님 정산은 캠핏이 100% 보장합니다.',
        benefits: [
            '예약률 평균 20% 상승',
            '취소 수수료 분쟁 제로',
            '캠핏이 정산 100% 보장',
            '고객 신뢰도 향상'
        ],
        cta: '안심취소 도입 신청',
        field: '안심취소_신청'
    },
    easy_camping: {
        id: 'easy_camping',
        title: '이지캠핑 도입',
        description: '초기 비용 0원! 500만원 상당 스노우라인 장비 무상 설치 및 A/S 전담 지원으로 공실률을 해결하세요.',
        benefits: [
            '초기 설치 비용 0원',
            '500만원 상당 장비 무상 제공',
            '전담 A/S 지원',
            '공실률 감소 효과'
        ],
        cta: '이지캠핑 도입 상담',
        field: '이지캠핑_신청'
    },
    coupon: {
        id: 'coupon',
        title: '할인 쿠폰 발행',
        description: '사장님의 캠핑장은 이미 훌륭합니다! 작은 할인 혜택으로 망설이는 고객의 결제를 이끌어내세요.',
        benefits: [
            '낮은 전환률 해결 솔루션',
            '5~10% 할인으로 예약률 상승',
            '캠지기센터에서 즉시 발행',
            '시즌별 전략적 활용 가능'
        ],
        cta: '캠지기센터에서 쿠폰 발행',
        field: '쿠폰 할인 긍정',
        externalLink: 'https://admin.camfit.co.kr/#/extra-service/host-coupon-list'
    }
};

export function GrowthActionModal({ isOpen, onClose, recordId, vibeScore = 0, totalScore = 0 }: GrowthActionModalProps) {
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleServiceClick = (serviceId: string) => {
        setSelectedService(serviceId);
    };

    const handleFinalSubmit = async (service: ServiceDetail) => {
        if (!recordId) {
            alert("오류: 레코드 ID가 없습니다. 페이지를 새로고침 해주세요.");
            return;
        }

        setLoadingAction(service.id);

        try {
            // Airtable PATCH - Only if field is defined
            if (service.field) {
                const response = await fetch('/api/airtable/update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recordId,
                        fields: { [service.field]: true }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Update failed");
                }
            }

            // Show success message only if it was a sync action
            if (service.field) {
                alert(`${service.title} 신청이 완료되었습니다! 담당자가 확인 후 연락드립니다.`);
            }

            // External link if exists
            if (service.externalLink) {
                window.open(service.externalLink, '_blank');
            }

            setSelectedService(null);
        } catch (error: any) {
            console.error("Action Sync Error:", error);

            // If sync fails but there's an external link, we should still let the user go there
            if (service.externalLink) {
                alert("데이터 동기화에 지연이 발생했으나, 신청 페이지로 이동합니다.");
                window.open(service.externalLink, '_blank');
                setSelectedService(null);
            } else {
                alert(`처리 중 오류가 발생했습니다: ${error.message}`);
            }
        } finally {
            setLoadingAction(null);
        }
    };

    // AI Recommendation Logic
    const getRecommendationBadge = (serviceId: string) => {
        if (serviceId === 'photographer' && vibeScore <= 50) {
            return <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full flex items-center gap-1 animate-pulse"><Zap className="w-3 h-3" />AI 추천: 사진 교체 시급! 🔥</span>;
        }
        if (serviceId === 'influencer' && vibeScore >= 70) {
            return <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-black px-2 py-1 rounded-full flex items-center gap-1"><Award className="w-3 h-3" />성공 확률 높음! ⭐</span>;
        }
        return null;
    };

    const shouldShowCoupon = totalScore >= 70;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <GlassCard className="w-full max-w-3xl relative z-60 animate-in zoom-in-95 duration-200 p-0 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-camfit-green to-emerald-600 p-6 flex items-center justify-between text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">캠핏에서 해결해봐요!</h2>
                            <p className="text-white/90 text-sm font-medium">서비스를 선택하면 상세 설명을 확인할 수 있어요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-white space-y-8 overflow-y-auto flex-1">

                    {/* Category Helper Component for Inline Expansion */}
                    {Object.entries({
                        '사진 퀄리티 개선': { icon: <Camera className="w-5 h-5 text-blue-600" />, ids: ['photographer', 'influencer', 'photo_contest'] },
                        '우리 캠핑장만의 경쟁력': { icon: <Star className="w-5 h-5 text-yellow-600" />, ids: ['safe_cancel', 'easy_camping'] },
                        '예약률 최적화': { icon: <TrendingDown className="w-5 h-5 text-red-600" />, ids: ['coupon'] }
                    }).map(([categoryName, category]) => {
                        const isAnyInThisCategorySelected = category.ids.includes(selectedService || "");

                        return (
                            <div key={categoryName} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    {category.icon}
                                    <h3 className="text-lg font-bold text-gray-900">{categoryName}</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {category.ids.map(serviceId => {
                                        const originalService = SERVICES[serviceId];
                                        // Dynamic text for coupon
                                        const service = serviceId === 'coupon' ? {
                                            ...originalService,
                                            description: totalScore >= 70
                                                ? "사장님의 캠핑장은 이미 훌륭합니다! 작은 할인 혜택으로 망설이는 고객의 결제를 이끌어내세요."
                                                : "사장님 캠핑장은 할인쿠폰을 통해 할인 혜택을 제공하여 고객을 모아보세요."
                                        } : originalService;

                                        const isSelected = selectedService === serviceId;
                                        return (
                                            <button
                                                key={serviceId}
                                                onClick={() => handleServiceClick(serviceId)}
                                                className={`relative w-full border-2 rounded-xl p-5 text-left transition-all ${isSelected
                                                    ? 'border-camfit-green bg-camfit-green/5 shadow-md scale-[0.99]'
                                                    : 'border-gray-200 hover:border-camfit-green/50 hover:shadow-sm'
                                                    }`}
                                            >
                                                {getRecommendationBadge(serviceId)}
                                                <div className="font-bold text-gray-900 text-base mb-1.5">{service.title}</div>
                                                <div className="text-xs text-gray-500 leading-relaxed pr-24">{service.description}</div>
                                                {isSelected && <CheckCircle2 className="w-6 h-6 text-camfit-green absolute bottom-5 right-5" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Inline Detailed Description (Accordion) */}
                                {isAnyInThisCategorySelected && selectedService && (
                                    <div className="bg-emerald-50/50 border-2 border-camfit-green/30 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-black text-gray-900">{SERVICES[selectedService].title}</h4>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    {selectedService === 'coupon'
                                                        ? (totalScore >= 70
                                                            ? "사장님의 캠핑장은 이미 훌륭합니다! 작은 할인 혜택으로 망설이는 고객의 결제를 이끌어내세요."
                                                            : "사장님 캠핑장은 할인쿠폰을 통해 할인 혜택을 제공하여 고객을 모아보세요.")
                                                        : SERVICES[selectedService].description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedService(null)}
                                                className="bg-white/50 p-1.5 rounded-full text-gray-400 hover:text-gray-600 border border-gray-100"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                            {SERVICES[selectedService].benefits.map((benefit, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 font-bold bg-white/60 p-3 rounded-lg border border-camfit-green/10">
                                                    <CheckCircle2 className="w-5 h-5 text-camfit-green fill-camfit-green/10 flex-shrink-0" />
                                                    <span>{benefit}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleFinalSubmit(SERVICES[selectedService])}
                                                disabled={loadingAction === selectedService}
                                                className="w-full bg-camfit-green text-white font-black py-5 px-8 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-camfit-green/20 text-lg active:scale-[0.99]"
                                            >
                                                {loadingAction === selectedService ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>{SERVICES[selectedService].cta}</span>
                                                        <ArrowRight className="w-6 h-6" />
                                                    </>
                                                )}
                                            </button>
                                            {(selectedService === 'safe_cancel' || selectedService === 'easy_camping') && (
                                                <p className="text-xs text-center text-gray-400 font-medium flex items-center justify-center gap-1.5 text-balance">
                                                    <span className="text-amber-500">💡</span> 신청 후 담당자가 확인하여 영업일 기준 1~2일 내 연락드립니다
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 font-medium flex-shrink-0 border-t">
                    Camfit Partner Success Team · 100곳 한정 지원
                </div>
            </GlassCard >
        </div >
    );
}
