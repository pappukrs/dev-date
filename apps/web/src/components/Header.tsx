"use client";

import { useState } from "react";
import { Cpu } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Header({ user }: { user: any }) {
    const [scrolled, setScrolled] = useState(false);

    // Add scroll listener effect if needed later for dynamic background
    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-black/20 border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Cpu className="text-white w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Dev-Date
                        </h1>
                        <span className="text-[10px] font-mono text-purple-400 tracking-wider uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Phase 3
                        </span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white">{user.displayName}</p>
                                <p className="text-xs text-gray-400 font-mono">Lvl {user.devScore ? Math.floor(user.devScore / 100) + 1 : 1}</p>
                            </div>
                            <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-10 h-10 rounded-full border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
                            />
                        </div>
                    ) : (
                        <a
                            href={`${API_BASE}/auth/github`}
                            className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                        >
                            Login with GitHub
                        </a>
                    )}
                </div>
            </div>
        </header>
    );
}
