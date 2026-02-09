interface SolutionImpactCardProps {
    icon: string;
    title: string;
    description: string;
    currentValue: string;
    improvedValue: string;
    improvement: string;
    actionText: string;
    onClick: () => void;
    color?: "green" | "blue" | "purple";
}

export function SolutionImpactCard({
    icon,
    title,
    description,
    currentValue,
    improvedValue,
    improvement,
    actionText,
    onClick,
    color = "green"
}: SolutionImpactCardProps) {
    const colorMap = {
        green: {
            bg: "from-emerald-50 to-teal-50/50",
            border: "border-emerald-100",
            text: "text-emerald-700",
            button: "bg-camfit-green hover:bg-emerald-600"
        },
        blue: {
            bg: "from-blue-50 to-cyan-50/50",
            border: "border-blue-100",
            text: "text-blue-700",
            button: "bg-blue-500 hover:bg-blue-600"
        },
        purple: {
            bg: "from-purple-50 to-pink-50/50",
            border: "border-purple-100",
            text: "text-purple-700",
            button: "bg-purple-500 hover:bg-purple-600"
        }
    };

    const style = colorMap[color];

    return (
        <div className={`bg-gradient-to-br ${style.bg} rounded-2xl p-5 border ${style.border} shadow-md hover:shadow-lg transition-all`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{icon}</span>
                <h4 className="text-base font-bold text-gray-900">{title}</h4>
            </div>

            <p className="text-xs text-gray-600 mb-4">{description}</p>

            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">현재</span>
                    <span className="font-bold text-gray-900">{currentValue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">개선 후</span>
                    <span className={`font-bold ${style.text}`}>{improvedValue}</span>
                </div>
            </div>

            <div className={`px-3 py-2 rounded-lg ${style.bg} border ${style.border} mb-4`}>
                <p className={`text-xs font-bold ${style.text} text-center`}>
                    📈 {improvement}
                </p>
            </div>

            <button
                onClick={onClick}
                className={`w-full ${style.button} text-white py-2.5 rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2`}
            >
                {actionText}
                <span>→</span>
            </button>
        </div>
    );
}
