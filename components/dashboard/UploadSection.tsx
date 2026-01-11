"use client";

import { useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TagGroup } from "@/components/ui/TagGroup";
import { UploadCloud, Loader2, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
    onAnalysisComplete: (data: any) => void;
    onLoadingChange: (isLoading: boolean) => void;
}

const LEISURE_OPTIONS = ["계곡", "바다", "갯벌", "강/호수", "수상레저", "낚시", "휴양림", "등산", "숲/산"];
const FACILITY_OPTIONS = ["트램펄린", "개별화장실/샤워실", "샤워실", "카페/매점", "바베큐장", "전기차충전소", "수영장", "놀이시설", "찜질방", "온수수영장", "반려견 동반"];
const ACTIVITY_OPTIONS = ["갯벌체험", "체험활동", "농장체험", "동물체험"];

export function UploadSection({ onAnalysisComplete, onLoadingChange }: UploadSectionProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [campingName, setCampingName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // ... (Tag States and Refs remain same)
    const [leisureTags, setLeisureTags] = useState<string[]>([]);
    const [facilityTags, setFacilityTags] = useState<string[]>([]);
    const [activityTags, setActivityTags] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ... (Helper functions remain same: handleFileDrop, addFiles, removeFile, compressImage)
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };
    const addFiles = (newFiles: File[]) => {
        const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
        if (files.length + validFiles.length > 20) {
            setErrorMsg("사진은 최대 20장까지만 업로드 가능합니다.");
            return;
        }
        setFiles(prev => [...prev, ...validFiles]);
        setErrorMsg(null);
    };
    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };
    // Image Compression Helper
    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1500;
                const MAX_HEIGHT = 1500;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    else reject(new Error("Compression failed"));
                }, "image/jpeg", 0.7);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        setIsLoading(true);
        onLoadingChange(true);
        setErrorMsg(null); // Clear previous errors

        try {
            const compressedFiles = await Promise.all(files.map(compressImage));
            const formData = new FormData();
            compressedFiles.forEach(file => formData.append("images", file));
            formData.append("campingName", campingName);
            formData.append("leisureTags", JSON.stringify(leisureTags));
            formData.append("facilityTags", JSON.stringify(facilityTags));
            formData.append("activityTags", JSON.stringify(activityTags));

            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Server responded with error");
            }
            onAnalysisComplete(data);
        } catch (error: any) {
            console.error(error);
            // Persistent Error Message UI
            setErrorMsg(`⚠️ 분석 실패: ${error.message || "알 수 없는 오류가 발생했습니다."}`);
        } finally {
            setIsLoading(false);
            onLoadingChange(false);
        }
    };

    return (
        <GlassCard className="space-y-8 animate-in slide-in-from-left duration-500">
            <div className="space-y-2 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-camfit-dark to-camfit-green">
                    Step 1. 기본 정보 & 태그 선택
                </h3>
                <p className="text-sm text-gray-500">정확한 분석을 위해 캠핑장의 특징을 모두 선택해주세요.</p>
            </div>

            {/* ERROR BANNER */}
            {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-pulse">
                    <div className="text-red-600 font-bold text-sm">
                        {errorMsg}
                    </div>
                    <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* ... (Rest of the form UI: Name Input, TagGroup, File Upload) ... */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">캠핑장 이름</label>
                    <Input placeholder="예: 포천 산정호수 글램핑" value={campingName} onChange={(e) => setCampingName(e.target.value)} required className="bg-white" />
                </div>
                <div className="space-y-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <TagGroup label="주변레저" options={LEISURE_OPTIONS} selected={leisureTags} onChange={setLeisureTags} />
                    <div className="h-px bg-gray-200 w-full" />
                    <TagGroup label="시설" options={FACILITY_OPTIONS} selected={facilityTags} onChange={setFacilityTags} />
                    <div className="h-px bg-gray-200 w-full" />
                    <TagGroup label="체험활동" options={ACTIVITY_OPTIONS} selected={activityTags} onChange={setActivityTags} />
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 block">사진 업로드 ({files.length}/20)<span className="text-gray-400 font-normal ml-2 text-xs">*최소 5장 이상 권장</span></label>
                    <div className={cn("relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center", isDragOver ? "border-camfit-green bg-camfit-green/10 scale-[1.02]" : "border-gray-300 hover:border-camfit-green hover:bg-gray-50", files.length > 0 ? "bg-white" : "")} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files?.length && addFiles(Array.from(e.target.files))} />
                        {files.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
                                <div className="p-4 bg-white rounded-full shadow-sm text-camfit-green"><UploadCloud className="w-8 h-8" /></div>
                                <div><p className="font-semibold text-gray-900">클릭하거나 사진을 드래그하세요</p><p className="text-xs text-gray-500 mt-1">최대 20장까지 한 번에 선택 가능</p></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 w-full pt-2" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs gap-1"><UploadCloud className="w-4 h-4" />추가하기</button>
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group shadow-sm bg-gray-100">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} />
                                        <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Button className="w-full h-14 text-lg font-bold shadow-camfit-green/20 hover:shadow-camfit-green/40 rounded-xl" type="submit" disabled={files.length === 0 || isLoading} isLoading={isLoading}>
                    {isLoading ? "AI 시니어 에디터가 분석중입니다..." : "AI 정밀 분석 시작하기"}
                </Button>
            </form>
        </GlassCard>
    );
}
