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

    const clickCount = calculateClickCount(totalScore);
    const percentile = 100 - totalScore;

    return (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-100 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-bold text-gray-900">100명 중 몇 명이 내 숙소를 클릭할까요?</h3>
            </div>

            <div className="relative w-full h-10 bg-gray-200/50 rounded-full overflow-hidden mb-3 shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-camfit-green to-emerald-400 transition-all duration-1000 ease-out"
                    style={{ width: `${clickCount}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-800">
                    {clickCount}명 클릭 예상
                </span>
            </div>

            <p className="text-sm text-gray-600 font-medium mb-2">
                사장님 캠핑장은 현재 <span className="font-bold text-camfit-green">상위 {percentile}%</span>의 매력을 가지고 있습니다.
            </p>

            <p className="text-[11px] text-gray-400 italic">
                ※ 본 데이터는 AI가 사진의 시인성을 기반으로 분석한 시뮬레이션이며, 실제 예약률을 보장하지는 않습니다.
            </p>
        </div>
    );
}
