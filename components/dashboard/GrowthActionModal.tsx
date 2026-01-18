"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { X, Camera, Sparkles, Star, TrendingDown, CheckCircle2, ArrowRight, Zap, Award } from "lucide-react";

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
    field: string;
    externalLink?: string;
}

const SERVICES: Record<string, ServiceDetail> = {
    photographer: {
        id: 'photographer',
        title: '전문 사진가 신청',
        description: '2박 숙박권 + 촬영비 비딩으로 시중가보다 30% 저렴하게 전문가를 매칭해 드립니다.',
        benefits: [
            '✅ 시중가 대비 30% 절감',
            '✅ 2박 숙박권으로 촬영비 대체',
            '✅ 캠핏 검증 전문가 매칭',
            '✅ 고퀄리티 원본 파일 제공'
        ],
        cta: '전문가 매칭 신청하기',
        field: '전문사진가_신청',
        externalLink: 'https://smore.im/form/V0zsSirSAM'
    },
    influencer: {
        id: 'influencer',
        title: '인플루언서/체험단 마케팅',
        description: '비용 부담 제로! 2박 숙박권 제공 시 캠핏 파워 인플루언서 매칭 및 SNS 홍보를 도와드립니다.',
        benefits: [
            '✅ 초기 비용 0원 (숙박권만 제공)',
            '✅ 캠핏 파워 인플루언서 매칭',
            '✅ 인스타/블로그 동시 홍보',
            '✅ 리뷰 콘텐츠 2차 활용 가능'
        ],
        cta: '인플루언서 매칭 신청',
        field: '인플루언서_신청'
    },
    photo_contest: {
        id: 'photo_contest',
        title: '사진 공모전 참여',
        description: '유저들이 직접 찍은 고퀄리티 홍보 사진을 확보할 기회! 별도 큐레이션 홍보 혜택 제공.',
        benefits: [
            '✅ 유저 참여형 마케팅',
            '✅ 고퀄리티 사진 무료 확보',
            '✅ 캠핏 메인 큐레이션 노출',
            '✅ 커뮤니티 활성화 효과'
        ],
        cta: '공모전 참여 신청',
        field: '사진공모전_참여'
    },
    safe_cancel: {
        id: 'safe_cancel',
        title: '안심취소 서비스',
        description: '취소 수수료 분쟁 끝! 고객이 취소해도 사장님 정산은 캠핏이 100% 보장합니다.',
        benefits: [
            '✅ 예약률 평균 20% 상승',
            '✅ 취소 수수료 분쟁 제로',
            '✅ 캠핏이 정산 100% 보장',
            '✅ 고객 신뢰도 향상'
        ],
        cta: '안심취소 도입 신청',
        field: '안심취소_신청'
    },
    easy_camping: {
        id: 'easy_camping',
        title: '이지캠핑 도입',
        description: '초기 비용 0원! 500만원 상당 스노우라인 장비 무상 설치 및 A/S 전담 지원으로 공실률을 해결하세요.',
        benefits: [
            '✅ 초기 설치 비용 0원',
            '✅ 500만원 상당 장비 무상 제공',
            '✅ 전담 A/S 지원',
            '✅ 공실률 감소 효과'
        ],
        cta: '이지캠핑 도입 상담',
        field: '이지캠핑_신청'
    },
    coupon: {
        id: 'coupon',
        title: '할인 쿠폰 발행',
        description: '사장님의 캠핑장은 이미 훌륭합니다! 작은 할인 혜택으로 망설이는 고객의 결제를 이끌어내세요.',
        benefits: [
            '✅ 점수 70점 이상 숙소 추천',
            '✅ 5~10% 할인으로 전환율 상승',
            '✅ 파트너센터에서 즉시 발행',
            '✅ 시즌별 전략적 활용 가능'
        ],
        cta: '파트너센터에서 쿠폰 발행',
        field: '쿠폰 할인 긍정',
        externalLink: 'https://partner.camfit.co.kr'
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
            // Airtable PATCH
            const response = await fetch('/api/airtable/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordId,
                    fields: { [service.field]: true }
                })
            });

            if (!response.ok) throw new Error("Update failed");

            alert(`${service.title} 신청이 완료되었습니다! 담당자가 확인 후 연락드립니다.`);

            // External link if exists
            if (service.externalLink) {
                setTimeout(() => {
                    window.open(service.externalLink, '_blank');
                }, 500);
            }

            setSelectedService(null);
        } catch (error) {
            console.error("Action Error:", error);
            alert("처리 중 오류가 발생했습니다.");
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
                <div className="p-6 bg-white space-y-6 overflow-y-auto flex-1">

                    {/* Category 1: 사진 퀄리티 개선 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <Camera className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-gray-900">사진 퀄리티 개선</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {['photographer', 'influencer', 'photo_contest'].map(serviceId => {
                                const service = SERVICES[serviceId];
                                const isSelected = selectedService === serviceId;
                                return (
                                    <button
                                        key={serviceId}
                                        onClick={() => handleServiceClick(serviceId)}
                                        className={`relative border-2 rounded-xl p-4 text-left transition-all ${isSelected
                                                ? 'border-camfit-green bg-camfit-green/5 shadow-lg'
                                                : 'border-gray-200 hover:border-camfit-green/50 hover:shadow-md'
                                            }`}
                                    >
                                        {getRecommendationBadge(serviceId)}
                                        <div className="font-bold text-gray-900 mb-1">{service.title}</div>
                                        <div className="text-xs text-gray-500 line-clamp-2">{service.description}</div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-camfit-green absolute bottom-3 right-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category 2: 우리 캠핑장만의 경쟁력 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <Star className="w-5 h-5 text-yellow-600" />
                            <h3 className="text-lg font-bold text-gray-900">우리 캠핑장만의 경쟁력</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['safe_cancel', 'easy_camping'].map(serviceId => {
                                const service = SERVICES[serviceId];
                                const isSelected = selectedService === serviceId;
                                return (
                                    <button
                                        key={serviceId}
                                        onClick={() => handleServiceClick(serviceId)}
                                        className={`relative border-2 rounded-xl p-4 text-left transition-all ${isSelected
                                                ? 'border-camfit-green bg-camfit-green/5 shadow-lg'
                                                : 'border-gray-200 hover:border-camfit-green/50 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="font-bold text-gray-900 mb-1">{service.title}</div>
                                        <div className="text-xs text-gray-500 line-clamp-2">{service.description}</div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-camfit-green absolute bottom-3 right-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category 3: 예약률 최적화 (조건부 표시) */}
                    {shouldShowCoupon && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                <h3 className="text-lg font-bold text-gray-900">예약률 최적화</h3>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">점수 70점 이상 추천</span>
                            </div>
                            <button
                                onClick={() => handleServiceClick('coupon')}
                                className={`relative w-full border-2 rounded-xl p-4 text-left transition-all ${selectedService === 'coupon'
                                        ? 'border-camfit-green bg-camfit-green/5 shadow-lg'
                                        : 'border-gray-200 hover:border-camfit-green/50 hover:shadow-md'
                                    }`}
                            >
                                <div className="font-bold text-gray-900 mb-1">{SERVICES.coupon.title}</div>
                                <div className="text-xs text-gray-500 line-clamp-2">{SERVICES.coupon.description}</div>
                                {selectedService === 'coupon' && <CheckCircle2 className="w-5 h-5 text-camfit-green absolute bottom-3 right-3" />}
                            </button>
                        </div>
                    )}

                    {/* Step 2: 상세 설명 (선택 시에만 표시) */}
                    {selectedService && (
                        <div className="bg-gradient-to-br from-camfit-green/10 to-emerald-50 border-2 border-camfit-green rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{SERVICES[selectedService].title}</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">{SERVICES[selectedService].description}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedService(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {SERVICES[selectedService].benefits.map((benefit, idx) => (
                                    <div key={idx} className="text-sm text-gray-700 font-medium">{benefit}</div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleFinalSubmit(SERVICES[selectedService])}
                                disabled={loadingAction === selectedService}
                                className="w-full bg-camfit-green text-white font-bold py-4 px-6 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-camfit-green/30"
                            >
                                {loadingAction === selectedService ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <>
                                        <span>{SERVICES[selectedService].cta}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-500">
                                💡 신청 후 담당자가 확인하여 영업일 기준 1~2일 내 연락드립니다
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 font-medium flex-shrink-0 border-t">
                    Camfit Partner Success Team · 100곳 한정 지원
                </div>
            </GlassCard>
        </div>
    );
}
