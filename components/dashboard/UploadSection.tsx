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
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 }); // Progress tracking
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

    // Client-side image compression utility
    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1600; // Balanced for speed
                    const MAX_HEIGHT = 1600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                });
                                // Cleanup reader result
                                img.src = "";
                                resolve(compressedFile);
                            } else {
                                reject(new Error("Canvas to Blob conversion failed"));
                            }
                        },
                        "image/jpeg",
                        0.7 // Reverted to 70% for maximum speed
                    );
                };
                img.onerror = () => reject(new Error("Image loading failed"));
            };
            reader.onerror = () => reject(new Error("FileReader failed"));
        });
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const addFiles = async (newFiles: File[]) => {
        const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
        if (files.length + validFiles.length > 10) {
            setErrorMsg("최고의 분석 결과를 위해 사진은 최대 10장까지만 선택 가능합니다.");
            return;
        }

        setIsLoading(true);
        setErrorMsg(null);

        try {
            const compressedResults: File[] = [];

            // SEQUENTIAL PROCESSING: One photo at a time to save mobile memory
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                setLoadingStage(`사진 최적화 중 (${i + 1}/${validFiles.length})`);

                const compressed = await compressImage(file);
                const fileWithPreview = Object.assign(compressed, {
                    preview: URL.createObjectURL(compressed)
                });
                compressedResults.push(fileWithPreview);

                // Hint to browser that we are done with original file if needed
                // (Though File objects are just pointers, the Reader/Canvas bit is what hurts)
            }

            setFiles(prev => [...prev, ...compressedResults]);
        } catch (err) {
            console.error("Compression Error:", err);
            setErrorMsg("사진 처리 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
            setLoadingStage("");
        }
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

    // Cloudinary Upload Helper
    const uploadToCloudinary = async (file: File, index: number): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'camfit_photo');
        formData.append('folder', 'camfit-analysis');

        const response = await fetch(
            'https://api.cloudinary.com/v1_1/dskn3gdhj/image/upload',
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudinary upload failed for image ${index + 1}`);
        }

        const data = await response.json();
        return data.secure_url;
    };

    // Client-Side: Direct Cloudinary Upload
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        setIsLoading(true);
        onLoadingChange(true);
        setErrorMsg(null);

        try {
            // Initialize progress
            setUploadProgress({ current: 0, total: files.length });
            const uploadedUrls: string[] = [];

            // STRICT SEQUENTIAL UPLOAD: One file at a time
            for (let i = 0; i < files.length; i++) {
                const fileNum = i + 1;
                const totalFiles = files.length;

                // Upload directly to Cloudinary
                setLoadingStage(`사진 올리는 중이에요 (${fileNum}/${totalFiles})`);

                try {
                    const cloudinaryUrl = await uploadToCloudinary(files[i], i);
                    uploadedUrls.push(cloudinaryUrl);
                } catch (err) {
                    console.error(`Upload failed for file ${i}:`, err);
                    throw new Error(`사진 ${fileNum} 업로드 실패. 다시 시도해주세요.`);
                }

                // Memory Cleanup
                if ((files[i] as any).preview) {
                    URL.revokeObjectURL((files[i] as any).preview);
                }

                // Update Progress
                setUploadProgress({ current: fileNum, total: totalFiles });
            }

            // AI Analysis (Send Cloudinary URLs)
            setLoadingStage("사장님 숙소를 꼼꼼히 살펴보는 중이에요...");

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
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    return (
        <GlassCard className="space-y-8 animate-in slide-in-from-left duration-500">
            <div className="space-y-2 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-camfit-dark to-camfit-green">
                    사장님 숙소 정보 입력
                </h3>
                <p className="text-sm text-gray-600">정확한 진단을 위해 간단히 입력해 주세요.</p>
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
                    <label className="text-sm font-bold text-gray-700 block">사진 업로드 ({files.length}/10)<span className="text-gray-400 font-normal ml-2 text-xs">*중요한 사진 5~10장만 골라주세요</span></label>
                    <div className={cn("relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center", isDragOver ? "border-camfit-green bg-camfit-green/10 scale-[1.02]" : "border-gray-300 hover:border-camfit-green hover:bg-gray-50", files.length > 0 ? "bg-white" : "")} onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.length && addFiles(Array.from(e.target.files))} />
                        {files.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
                                <div className="p-4 bg-white rounded-full shadow-sm text-camfit-green"><UploadCloud className="w-8 h-8" /></div>
                                <div><p className="font-semibold text-gray-900">클릭하거나 사진을 드래그하세요</p><p className="text-xs text-gray-500 mt-1">최대 10장까지 한 번에 선택 가능</p></div>
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

                {/* Progress UI - Shows during upload */}
                {uploadProgress.total > 0 && (
                    <div className="bg-camfit-green/5 border border-camfit-green/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-camfit-dark">
                                진행률: {uploadProgress.current}/{uploadProgress.total} 완료
                            </span>
                            <span className="text-camfit-green font-bold">
                                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-camfit-green to-camfit-dark h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-600 text-center">
                            ⚠️ 창을 닫거나 새로고침하지 마세요. AI가 정밀 분석 중입니다.
                        </p>
                    </div>
                )}

                <Button className="w-full h-14 text-lg font-bold shadow-camfit-green/20 hover:shadow-camfit-green/40 rounded-xl" type="submit" disabled={files.length === 0 || isLoading} isLoading={isLoading}>
                    {isLoading ? (loadingStage || "진단 중이에요...") : "내 숙소 진단받기"}
                </Button>
            </form>
            <Script
                src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="lazyOnload"
            />
        </GlassCard>
    );
}
