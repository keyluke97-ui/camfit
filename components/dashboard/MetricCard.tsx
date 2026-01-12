import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnalysisMetric } from "@/lib/mockData";

interface MetricCardProps {
    label: string;
    score: number;
    comment: string;
    description?: string;
    trend: "up" | "down" | "neutral";
    metricId?: AnalysisMetric;
}

export function MetricCard({ label, score, comment, description, trend, metricId }: MetricCardProps) {
    return (
        <GlassCard className="flex flex-col justify-between h-full space-y-4" hoverEffect>
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-gray-900 tracking-tight">{label}</h4>
                    {trend === "up" && <TrendingUp className="w-4 h-4 text-camfit-green" />}
                    {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
                    {trend === "neutral" && <Minus className="w-4 h-4 text-gray-400" />}
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
                {/* Simple progress bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-camfit-green transition-all duration-1000"
                        style={{ width: `${isNaN(score) ? 0 : score}%` }}
                    />
                </div>
            </div>
        </GlassCard>
    );
}
