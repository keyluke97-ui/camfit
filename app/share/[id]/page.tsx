import { getAnalysisResult } from "@/lib/airtable";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: {
        id: string;
    };
}

// Server Component
export default async function SharePage({ params }: PageProps) {
    const { id } = params;
    const data = await getAnalysisResult(id);

    if (!data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
                <GlassCard className="max-w-md w-full text-center space-y-4 p-8">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">분석 결과를 찾을 수 없습니다</h2>
                    <p className="text-gray-500 text-sm">
                        요청하신 리포트가 존재하지 않거나 삭제되었을 수 있습니다.<br />
                        URL을 다시 한 번 확인해 주세요.
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-camfit-green hover:underline mt-4">
                        <ArrowLeft className="w-4 h-4" />
                        새로 무료 진단하기
                    </Link>
                </GlassCard>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-24 relative overflow-hidden bg-gray-50">
            {/* Background Decor (Same as Home) */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-camfit-green/5 via-white/50 to-transparent pointer-events-none -z-10" />
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="z-10 w-full max-w-7xl space-y-6 main-container mx-auto">
                {/* Header Navigation for Shared View */}
                <header className="flex items-center justify-between py-4 mb-4">
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-camfit-green transition-colors font-medium text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        나도 무료 진단 받기
                    </Link>
                    <div className="px-3 py-1 bg-white/50 border border-gray-200 rounded-full text-[11px] text-gray-400 font-medium">
                        ReadOnly View
                    </div>
                </header>

                <AnalysisDashboard
                    data={data}
                    isLoading={false}
                    files={[]} // No local files in share mode
                />
            </div>
        </main>
    );
}
