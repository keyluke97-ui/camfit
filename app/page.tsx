"use client";

import { useState } from "react";
import { UploadSection } from "@/components/dashboard/UploadSection";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";

export default function Home() {
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Lifted State for Image Preview Sharing
    const [files, setFiles] = useState<File[]>([]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-24 relative overflow-hidden bg-gray-50">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-camfit-green/5 via-white/50 to-transparent pointer-events-none -z-10" />
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="z-10 w-full max-w-7xl space-y-12">
                <header className="text-center space-y-6 mb-16 animate-in slide-in-from-top duration-700">
                    <h2 className="text-camfit-green font-bold tracking-wide text-sm">캠핏 숙소 진단</h2>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-camfit-dark">
                        사장님의 소중한 숙소, <br className="md:hidden" />
                        <span className="relative inline-block">
                            지금 손님들에게 어떻게 보일까요?
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-camfit-green opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-gray-600 font-medium text-lg max-w-2xl mx-auto">
                        간단한 사진 몇 장으로 <br className="hidden md:block" />
                        따뜻하게 진단해 드립니다.
                    </p>

                    {/* Warm Introduction Box */}
                    <div className="max-w-3xl mx-auto mt-8 p-6 bg-gradient-to-r from-camfit-green/5 to-emerald-50/50 rounded-2xl border border-camfit-green/20">
                        <p className="text-gray-700 text-base leading-relaxed">
                            💡 복잡한 수치 대신, <span className="font-semibold text-camfit-dark">사장님의 소중한 숙소가 고객들에게 어떻게 보이는지</span> 따뜻하게 진단해 드립니다.
                        </p>
                    </div>
                </header>

                {/* Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Upload & Config */}
                    <div className="lg:col-span-4 space-y-6 sticky top-8">
                        <UploadSection
                            files={files}
                            setFiles={setFiles}
                            onAnalysisComplete={setAnalysisData}
                            onLoadingChange={setIsLoading}
                        />

                        {/* Helper Card */}
                        <div className="p-6 bg-white/50 rounded-xl border border-gray-100 text-sm text-gray-600 space-y-2">
                            <p className="font-semibold text-gray-700">💡 사장님 꿀팁</p>
                            <p>전경, 객실, 화장실 사진을 함께 넣으시면<br />더 정확한 진단을 받으실 수 있어요!</p>
                        </div>
                    </div>

                    {/* Right: AI Dashboard */}
                    <div className="lg:col-span-8">
                        <AnalysisDashboard
                            data={analysisData}
                            isLoading={isLoading}
                            files={files} // Pass files for preview matching
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
