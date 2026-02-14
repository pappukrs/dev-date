"use client";

import { useState } from "react";
import { Home, Heart, Trophy, Rocket, Code2 } from "lucide-react";

type Tab = 'dashboard' | 'dating' | 'reputation' | 'marketplace' | 'pairing';

// ReactNode type for icon
import { ReactNode } from "react";

const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-6 h-6" /> },
    { key: 'dating', label: 'Dating', icon: <Heart className="w-6 h-6" /> },
    { key: 'reputation', label: 'Reputation', icon: <Trophy className="w-6 h-6" /> },
    { key: 'marketplace', label: 'Marketplace', icon: <Rocket className="w-6 h-6" /> },
    { key: 'pairing', label: 'Pair Code', icon: <Code2 className="w-6 h-6" /> },
];

export default function FloatingDock({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
    const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-end gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 transition-all duration-300 hover:scale-105">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.key;
                    const isHovered = hoveredTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            onMouseEnter={() => setHoveredTab(tab.key)}
                            onMouseLeave={() => setHoveredTab(null)}
                            className={`group relative flex flex-col items-center justify-center transition-all duration-300 ease-out 
                                ${isActive ? 'w-16 h-16 -translate-y-2' : 'w-12 h-12 hover:w-14 hover:h-14 hover:-translate-y-1'}
                            `}
                        >
                            {/* Icon Container */}
                            <div className={`
                                w-full h-full rounded-xl flex items-center justify-center shadow-lg transition-all duration-300
                                ${isActive
                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-purple-500/40 scale-110'
                                    : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white hover:shadow-white/10'}
                            `}>
                                {tab.icon}
                            </div>

                            {/* Tooltip */}
                            <span className={`
                                absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 border border-white/10
                                text-xs font-bold text-white opacity-0 transition-all duration-200 pointer-events-none whitespace-nowrap
                                ${isHovered ? 'opacity-100 -translate-y-1' : ''}
                            `}>
                                {tab.label}
                            </span>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
