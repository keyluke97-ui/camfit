"use client";

import { cn } from "@/lib/utils";

interface TagGroupProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    singleSelect?: boolean;
}

export function TagGroup({ label, options, selected, onChange, singleSelect = false }: TagGroupProps) {

    const toggleOption = (option: string) => {
        if (singleSelect) {
            // Toggle logic for single select (radio-like behavior)
            if (selected.includes(option)) {
                onChange([]); // Deselect if verified
            } else {
                onChange([option]);
            }
        } else {
            // Multi select logic
            if (selected.includes(option)) {
                onChange(selected.filter((item) => item !== option));
            } else {
                onChange([...selected, option]);
            }
        }
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 block">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = selected.includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                isSelected
                                    ? "bg-camfit-dark text-white border-camfit-dark shadow-md transform scale-105"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-camfit-green hover:text-camfit-green"
                            )}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
