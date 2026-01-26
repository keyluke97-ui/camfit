import { GlassCard } from "@/components/ui/GlassCard";
import { TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { AnalysisMetric } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    label: string;
    score: number;
    comment: string;
    description?: string;
    trend: "up" | "down" | "neutral";
    metricId?: AnalysisMetric;
    suggestion?: {
        text: string;
        type: 'amber' | 'red' | 'green';
    };
}

export function MetricCard({ label, score, comment, description, trend, metricId, suggestion }: MetricCardProps) {
    return (
        <GlassCard className="flex flex-col justify-between h-full space-y-4 relative overflow-hidden" hoverEffect>
            {/* Suggestion Badge */}
            {suggestion && (
                <div className={cn(
                    "absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700",
                    suggestion.type === 'amber' && "bg-amber-100 text-amber-700 border-l border-b border-amber-200",
                    suggestion.type === 'red' && "bg-red-50 text-red-600 border-l border-b border-red-100",
                    suggestion.type === 'green' && "bg-camfit-green/10 text-camfit-green border-l border-b border-camfit-green/20"
                )}>
                    {suggestion.type === 'amber' && <Lightbulb className="w-3 h-3 animate-pulse" />}
                    {suggestion.text}
                </div>
            )}

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-gray-900 tracking-tight">{label}</h4>
                    <div className="flex items-center gap-1.5">
                        {trend === "up" && <TrendingUp className="w-4 h-4 text-camfit-green" />}
                        {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
                        {trend === "neutral" && <Minus className="w-4 h-4 text-gray-400" />}
                    </div>
                </div>
                {description && (
                    <p className="text-[11px] text-gray-500 font-medium leading-tight">
                        {description}
                    </p>
                )}
            </div>

            <div>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-extrabold text-camfit-dark">{score}</span>
                    <span className="text-sm text-gray-400 mb-1">/ 100</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {comment}
                </p>
            </div>

            <div className="pt-2">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000",
                            score >= 80 ? "bg-camfit-green" : score >= 40 ? "bg-amber-400" : "bg-red-400"
                        )}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>
        </GlassCard>
    );
}
