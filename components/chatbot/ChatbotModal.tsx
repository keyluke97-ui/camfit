"use client";

import { useState } from "react";
import { X, MessageCircle, ExternalLink } from "lucide-react";

interface ChatbotModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId: string;
}

export function ChatbotModal({ isOpen, onClose, recordId }: ChatbotModalProps) {
    const [step, setStep] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen) return null;

    const updateAirtable = async (fieldName: string) => {
        setIsUpdating(true);
        try {
            const response = await fetch("/api/airtable/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recordId, fieldName })
            });

            if (response.ok) {
                console.log(`✅ ${fieldName} 업데이트 완료`);
            } else {
                console.error("업데이트 실패:", await response.text());
            }
        } catch (error) {
            console.error("API 호출 오류:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const options = [
        {
            id: 1,
            title: "사진을 개선하고 싶어요!",
            buttons: [
                {
                    label: "슈퍼팬/포토파트너/크레에이터 신청",
                    action: () => window.open("https://smore.im/form/V0zsSirSAM", "_blank")
                },
                {
                    label: "사진 공모전 참여하기",
                    action: () => updateAirtable("사진공모전_참여")
                }
            ]
        },
        {
            id: 2,
            title: "기획전에 참여하고 싶어요!",
            buttons: [
                {
                    label: "기획전 참여 신청",
                    action: () => updateAirtable("기획전_신청")
                }
            ]
        },
        {
            id: 3,
            title: "우리 캠핑장에 다른 경쟁력을 부여하고 싶어요!",
            buttons: [
                {
                    label: "안심취소 서비스 신청",
                    action: () => updateAirtable("안심취소_신청")
                },
                {
                    label: "이지캠핑 신청",
                    action: () => updateAirtable("이지캠핑_신청")
                }
            ]
        },
        {
            id: 4,
            title: "점수는 높은데, 예약률이 만족스럽지 않아요",
            aiResponse: "사장님 캠핑장은 매력적이지만 마지막 확신이 필요합니다. 쿠폰을 발행해 보세요!",
            buttons: [
                {
                    label: "쿠폰 발행하러 가기",
                    action: () => {
                        updateAirtable("쿠폰 할인 긍정");
                        window.open("https://partner.camfit.co.kr", "_blank");
                    }
                }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 animate-in slide-in-from-bottom duration-500">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-camfit-green to-emerald-400 text-white p-6 rounded-t-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6" />
                        <h2 className="text-xl font-bold">캠핏 성장 컨시어지</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-2 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Chat Content */}
                <div className="p-6 space-y-6">
                    {/* Welcome Message */}
                    <div className="bg-gray-100 rounded-2xl p-4 animate-in slide-in-from-left duration-500">
                        <p className="text-gray-800 font-medium leading-relaxed">
                            안녕하세요 사장님! 👋<br />
                            캠핑장 성장을 도와드릴 캠핏 컨시어지입니다.<br />
                            어떤 부분이 가장 궁금하신가요?
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        {options.map((option, index) => (
                            <div
                                key={option.id}
                                className="animate-in slide-in-from-right duration-500"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <button
                                    onClick={() => setStep(option.id)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${step === option.id
                                            ? "border-camfit-green bg-emerald-50"
                                            : "border-gray-200 hover:border-camfit-green hover:bg-gray-50"
                                        }`}
                                >
                                    <p className="font-bold text-gray-900">{option.title}</p>
                                </button>

                                {/* AI Response & Buttons */}
                                {step === option.id && (
                                    <div className="mt-4 space-y-3 animate-in slide-in-from-top duration-300">
                                        {option.aiResponse && (
                                            <div className="bg-camfit-green/10 border border-camfit-green/30 rounded-2xl p-4">
                                                <p className="text-gray-800 font-medium leading-relaxed">
                                                    {option.aiResponse}
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {option.buttons.map((btn, btnIndex) => (
                                                <button
                                                    key={btnIndex}
                                                    onClick={btn.action}
                                                    disabled={isUpdating}
                                                    className="w-full bg-camfit-green hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span>{btn.label}</span>
                                                    <ExternalLink className="w-5 h-5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
