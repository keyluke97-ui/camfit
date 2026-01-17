"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TagGroup } from "@/components/ui/TagGroup";
import { UploadCloud, Loader2, X, Image as ImageIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import imageCompression from 'browser-image-compression';
import { upload } from '@vercel/blob/client';

interface UploadSectionProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    onAnalysisComplete: (data: any) => void;
    onLoadingChange: (isLoading: boolean) => void;
}

const LEISURE_OPTIONS = ["계곡", "바다", "갯벌", "강/호수", "수상레저", "낚시", "휴양림", "등산", "숲/산"];
const FACILITY_OPTIONS = ["트램펄린", "개별화장실/샤워실", "샤워실", "카페/매점", "바베큐장", "전기차충전소", "수영장", "놀이시설", "찜질방", "온수수영장", "반려견 동반"];
const ACTIVITY_OPTIONS = ["갯벌체험", "체험활동", "농장체험", "동물체험"];

export function UploadSection({ files, setFiles, onAnalysisComplete, onLoadingChange }: UploadSectionProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [campingName, setCampingName] = useState("");
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>(""); // Detailed loading state
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [leisureTags, setLeisureTags] = useState<string[]>([]);
    const [facilityTags, setFacilityTags] = useState<string[]>([]);
    const [activityTags, setActivityTags] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Memory Cleanup for Previews
    useEffect(() => {
        return () => {
            files.forEach(file => {
                if ((file as any).preview) URL.revokeObjectURL((file as any).preview);
            });
        };
    }, [files]);

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

        // Add preview property safely
        const filesWithPreviews = validFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));

        setFiles(prev => [...prev, ...filesWithPreviews]);
        setErrorMsg(null);
    };

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            const removed = newFiles.splice(index, 1)[0];
            if ((removed as any).preview) URL.revokeObjectURL((removed as any).preview);
            return newFiles;
        });
    };

    const handleAddressSearch = () => {
        // @ts-ignore
        if (typeof window !== "undefined" && window.daum && window.daum.Postcode) {
            // @ts-ignore
            new window.daum.Postcode({
                oncomplete: function (data: any) {
                    setAddress(data.address);
                }
            }).open();
        } else {
            alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }
    };

    // Client-Side Optimization: 1. Compress -> 2. Upload to Blob -> 3. Analysis
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        setIsLoading(true);
        onLoadingChange(true);
        setErrorMsg(null);

        try {
            // Step 1: Compression
            setLoadingStage("모바일 최적화 및 압축 중...");
            const compressedFiles = [];

            // Sequential compression to save memory
            for (let i = 0; i < files.length; i++) {
                try {
                    const compressed = await imageCompression(files[i], {
                        maxSizeMB: 1.5,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true
                    });
                    compressedFiles.push(compressed);
                } catch (err) {
                    console.warn(`Compression failed for file ${i}, using original.`);
                    compressedFiles.push(files[i]);
                }
            }

            // Step 2: Upload to Vercel Blob (Client Side)
            setLoadingStage("클라우드 서버로 안전하게 전송 중...");
            const uploadedUrls = [];

            // Batch uploads (concurrency 3)
            const uploadBatch = async (file: File) => {
                const newBlob = await upload(`camfit/${Date.now()}_${file.name}`, file, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                });
                return newBlob.url;
            };

            // Using simple Promise.all for now, can be optimized further if needed
            // Optimized: We upload specific files
            uploadedUrls.push(...await Promise.all(compressedFiles.map(uploadBatch)));

            // Step 3: AI Analysis (Send URLs only)
            setLoadingStage("AI가 캠핑장을 정밀 분석 중입니다...");

            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrls: uploadedUrls,
                    campingName,
                    address,
                    leisureTags,
                    facilityTags,
                    activityTags
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Analysis Failed (${response.status})`);
            }

            const data = await response.json();
            onAnalysisComplete(data);

        } catch (error: any) {
            console.error("Upload/Analysis Error:", error);
            setErrorMsg(`⚠️ 오류 발생: ${error.message || "알 수 없는 오류가 발생했습니다."}`);
        } finally {
            setIsLoading(false);
            onLoadingChange(false);
            setLoadingStage("");
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">캠핑장 이름</label>
                        <Input placeholder="예: 포천 산정호수 글램핑" value={campingName} onChange={(e) => setCampingName(e.target.value)} required className="bg-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">캠핑장 주소</label>
                        <div className="relative group">
                            <Input
                                placeholder="돋보기 버튼을 눌러 주소를 검색해주세요"
                                value={address}
                                readOnly
                                onClick={handleAddressSearch}
                                className="bg-white pr-12 cursor-pointer group-hover:border-camfit-green transition-colors"
                            />
                            <button
                                type="button"
                                onClick={handleAddressSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-camfit-green transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
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
                    <div className={cn("relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center", isDragOver ? "border-camfit-green bg-camfit-green/10 scale-[1.02]" : "border-gray-300 hover:border-camfit-green hover:bg-gray-50", files.length > 0 ? "bg-white" : "")} onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.length && addFiles(Array.from(e.target.files))} />
                        {files.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
                                <div className="p-4 bg-white rounded-full shadow-sm text-camfit-green"><UploadCloud className="w-8 h-8" /></div>
                                <div><p className="font-semibold text-gray-900">클릭하거나 사진을 드래그하세요</p><p className="text-xs text-gray-500 mt-1">최대 20장까지 한 번에 선택 가능</p></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 w-full pt-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs gap-1"><UploadCloud className="w-4 h-4" />추가하기</button>
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group shadow-sm bg-gray-100">
                                        <img
                                            src={(file as any).preview}
                                            alt="preview"
                                            className="w-full h-full object-cover"
                                        // No onLoad revoke here, done in cleanup
                                        />

                                        {/* Number Badge */}
                                        <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 border border-white/20">
                                            {idx + 1}
                                        </div>

                                        <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Button className="w-full h-14 text-lg font-bold shadow-camfit-green/20 hover:shadow-camfit-green/40 rounded-xl" type="submit" disabled={files.length === 0 || isLoading} isLoading={isLoading}>
                    {isLoading ? (loadingStage || "AI 분석 중...") : "AI 정밀 분석 시작하기"}
                </Button>
            </form>
            <Script
                src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="lazyOnload"
            />
        </GlassCard>
    );
}
