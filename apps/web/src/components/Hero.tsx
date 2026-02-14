"use client";

import { useEffect, useState } from "react";
import { Zap, Github, ArrowRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Hero() {
    return (
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden mt-10">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -z-10"></div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 hover:bg-white/10 transition cursor-default">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Phase 3 is Live: Reputation & Marketplace
                    </span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white leading-[1.1]">
                    Code. Connect. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                        Collaborate.
                    </span>
                </h1>

                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    The ultimate platform for developers to find peers, mentors, and maybe something more.
                    Verify your skills via GitHub to join the exclusive network.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <a
                        href={`${API_BASE}/auth/github`}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:scale-105 transition shadow-lg shadow-purple-500/25 flex items-center gap-3"
                    >
                        <Github className="w-6 h-6" />
                        Join via GitHub
                    </a>
                    <button className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition flex items-center gap-2 backdrop-blur-sm">
                        <span>Learn More</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Social Proof */}
                <div className="pt-12 flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-white">10k+</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Developers</span>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-white">50k+</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Matches</span>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-white">1M+</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Lines of Code</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
