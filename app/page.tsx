"use client";

import { useState } from "react";
import { UploadSection } from "@/components/dashboard/UploadSection";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";

export default function Home() {
    const [analysisData, setAnalysisData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-24 relative overflow-hidden bg-gray-50">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-camfit-green/5 via-white/50 to-transparent pointer-events-none -z-10" />
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="z-10 w-full max-w-7xl space-y-12">
                <header className="text-center space-y-4 mb-16 animate-in slide-in-from-top duration-700">
                    <h2 className="text-camfit-green font-bold tracking-[0.2em] text-sm">CAMFIT AI LAB</h2>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-camfit-dark">
                        지금 이 순간부터 <br className="md:hidden" />
                        <span className="relative inline-block">
                            모험이 되도록
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-camfit-green opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
                        대한민국 1등 캠핑 플랫폼 캠핏의 데이터를 기반으로 <br className="hidden md:block" />
                        당신의 캠핑장을 1분 만에 진단해드립니다.
                    </p>
                </header>

                {/* Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Upload & Config */}
                    <div className="lg:col-span-4 space-y-6 sticky top-8">
                        <UploadSection
                            onAnalysisComplete={setAnalysisData}
                            onLoadingChange={setIsLoading}
                        />

                        {/* Helper Card */}
                        <div className="p-6 bg-white/50 rounded-xl border border-gray-100 text-sm text-gray-500 space-y-2">
                            <p className="font-semibold text-gray-700">💡 Tip</p>
                            <p>전경 사진, 사이트 근접 사진, 편의시설 사진을 넣으면 더 정확한 결과가 나옵니다.</p>
                        </div>
                    </div>

                    {/* Right: AI Dashboard */}
                    <div className="lg:col-span-8">
                        <AnalysisDashboard data={analysisData} isLoading={isLoading} />
                    </div>
                </div>
            </div>
        </main>
    );
}
