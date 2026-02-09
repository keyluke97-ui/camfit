"use client";

import { motion } from "framer-motion";

interface ScoreGaugeProps {
    score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
    // SVG Arc calculations
    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    // We want a 180 degree arc (semicircle) or slightly more. 
    // Let's do a 240 degree arc for a "gauge" look.
    const arcLength = circumference * (240 / 360);
    const strokeDashoffset = arcLength - (score / 100) * arcLength;

    return (
        <div className="relative flex flex-col items-center justify-center p-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="rotate-[150deg] transform" // Rotate to start from bottom left
                >
                    {/* Background Track */}
                    <circle
                        stroke="#f3f4f6"
                        strokeWidth={stroke}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        stroke="#01DF82"
                        strokeWidth={stroke}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={arcLength} // Start empty
                        fontSize={0} // Fix spacing issues
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Total Score</span>
                    <span className="text-5xl font-black text-camfit-dark">{score}</span>
                </div>
            </div>
        </div>
    );
}
