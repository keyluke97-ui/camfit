interface SimulationBannerProps {
    totalScore: number;
}

export function SimulationBanner({ totalScore }: SimulationBannerProps) {
    // User-approved click count formula
    const calculateClickCount = (score: number): number => {
        if (score >= 85) return 60;
        if (score >= 70) return 40;
        if (score >= 50) return 20;
        if (score >= 30) return 10;
        return 5;
    };

    const currentClicks = calculateClickCount(totalScore);
    const improvedClicks = Math.min(100, currentClicks + 20);
    const percentile = 100 - totalScore;

    return (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-100 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-bold text-gray-900">100명 중 몇 명이 내 숙소를 클릭할까요?</h3>
            </div>

            {/* Current State */}
            <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2 font-medium">현재 상태</p>
                <div className="relative w-full h-10 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-1000 ease-out"
                        style={{ width: `${currentClicks}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-800">
                        {currentClicks}명
                    </span>
                </div>
            </div>

            {/* Improved State with Camfit */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-camfit-green">캠핏 서비스 도입 시</p>
                    <span className="text-xs font-black text-camfit-green bg-emerald-50 px-2 py-0.5 rounded-full">
                        +20명 증가! 🚀
                    </span>
                </div>
                <div className="relative w-full h-10 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-camfit-green to-emerald-400 transition-all duration-1000 ease-out delay-300"
                        style={{ width: `${improvedClicks}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-800">
                        {improvedClicks}명
                    </span>
                </div>
            </div>

            <p className="text-sm text-gray-600 font-medium mb-1">
                사장님 캠핑장은 현재 <span className="font-bold text-camfit-green">상위 {percentile}%</span>의 매력을 가지고 있습니다.
            </p>

            <p className="text-[11px] text-gray-400 italic">
                ※ 본 데이터는 AI가 사진의 시인성을 기반으로 분석한 시뮬레이션이며, 실제 예약률을 보장하지는 않습니다.
            </p>
        </div>
    );
}
