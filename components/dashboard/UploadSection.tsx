"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
    onAnalysisComplete: (data: any) => void;
    onLoadingChange: (isLoading: boolean) => void;
}

export function UploadSection({ onAnalysisComplete, onLoadingChange }: UploadSectionProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [campingName, setCampingName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        onLoadingChange(true);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("campingName", campingName);

            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            onAnalysisComplete(data);
        } catch (error) {
            console.error(error);
            alert("분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
            onLoadingChange(false);
        }
    };

    return (
        <GlassCard className="space-y-6 animate-in slide-in-from-left duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-camfit-dark to-camfit-green">
                    캠핑장 정보 입력
                </h3>
                <p className="text-sm text-gray-500">분석할 캠핑장의 사진과 정보를 입력해주세요.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">캠핑장 이름</label>
                    <Input
                        placeholder="예: 포천 산정호수 글램핑"
                        value={campingName}
                        onChange={(e) => setCampingName(e.target.value)}
                        required
                    />
                </div>

                <div className="pt-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">사진 업로드</label>
                    <div
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer overflow-hidden",
                            isDragOver
                                ? "border-camfit-green bg-camfit-green/10 scale-[1.02]"
                                : "border-gray-300 hover:border-camfit-green hover:bg-gray-50",
                            file && "border-camfit-green bg-emerald-50"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                        />

                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <div className={cn("p-4 rounded-full shadow-sm transition-colors", file ? "bg-camfit-green text-white" : "bg-white text-camfit-green")}>
                                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {file ? file.name : "클릭하거나 드래그하여 업로드"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    JPG, A.PNG (최대 50MB)
                                </p>
                            </div>
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/50 pointer-events-none" />
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg shadow-camfit-green/20 hover:shadow-camfit-green/40"
                    type="submit"
                    disabled={!file || isLoading}
                    isLoading={isLoading}
                >
                    {isLoading ? "AI가 분석 중입니다..." : "AI 분석 시작하기"}
                </Button>
            </form>
        </GlassCard>
    );
}
