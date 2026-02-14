"use client";

import { useState, useEffect, ReactNode } from "react";
import { Sprout, Zap, Hammer, Crown, Award, Activity, Trophy, Medal } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LeaderboardEntry {
    userId: string;
    totalPoints: number;
    level: string;
    badges: string[];
}

interface UserRep {
    totalPoints: number;
    level: string;
    badges: string[];
    recentEvents?: { action: string; points: number; reason: string; createdAt: string }[];
}

const LEVEL_CONFIG: Record<string, { color: string; icon: ReactNode; minPoints: number; nextLevel: string | null; nextPoints: number }> = {
    'Junior': { color: 'from-green-400 to-emerald-500', icon: <Sprout className="w-12 h-12" />, minPoints: 0, nextLevel: 'Senior', nextPoints: 100 },
    'Senior': { color: 'from-blue-400 to-cyan-500', icon: <Zap className="w-12 h-12" />, minPoints: 100, nextLevel: 'Architect', nextPoints: 300 },
    'Architect': { color: 'from-purple-400 to-violet-500', icon: <Hammer className="w-12 h-12" />, minPoints: 300, nextLevel: 'Legend', nextPoints: 500 },
    'Legend': { color: 'from-amber-400 to-orange-500', icon: <Crown className="w-12 h-12" />, minPoints: 500, nextLevel: null, nextPoints: 1000 },
};

export default function ReputationBadge({ currentUser }: { currentUser: any }) {
    const [reputation, setReputation] = useState<UserRep | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'profile' | 'leaderboard'>('profile');

    const userId = currentUser?.id || currentUser?.githubId;

    useEffect(() => {
        if (userId) fetchReputation();
        fetchLeaderboard();
    }, [userId]);

    const fetchReputation = async () => {
        try {
            const res = await fetch(`${API_BASE}/reputation/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setReputation(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch reputation", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_BASE}/reputation/leaderboard?limit=10`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch leaderboard", err);
        }
    };

    if (loading) return <div className="text-center p-10 animate-pulse text-purple-400">Loading reputation...</div>;

    const level = reputation?.level || 'Junior';
    const config = LEVEL_CONFIG[level];
    const points = reputation?.totalPoints || 0;
    const progress = config.nextLevel
        ? Math.min(((points - config.minPoints) / (config.nextPoints - config.minPoints)) * 100, 100)
        : 100;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Tab Selector */}
            <div className="flex gap-2 bg-gray-800 p-1 rounded-xl">
                <button
                    onClick={() => setTab('profile')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${tab === 'profile' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    My Reputation
                </button>
                <button
                    onClick={() => setTab('leaderboard')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${tab === 'leaderboard' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Leaderboard
                </button>
            </div>

            {tab === 'profile' ? (
                <div className="space-y-4">
                    {/* Level Badge */}
                    <div className={`bg-gradient-to-r ${config.color} p-[2px] rounded-2xl`}>
                        <div className="bg-gray-900 rounded-2xl p-6 text-center">
                            <div className="mb-2 flex justify-center text-white">{config.icon}</div>
                            <h3 className="text-2xl font-black text-white">{level}</h3>
                            <p className="text-gray-400 text-sm mt-1">{points} XP Total</p>

                            {/* XP Progress Bar */}
                            {config.nextLevel && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>{config.minPoints} XP</span>
                                        <span>{config.nextPoints} XP ({config.nextLevel})</span>
                                    </div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-1000`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    {reputation?.badges && reputation.badges.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Badges Earned
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {reputation.badges.map(badge => (
                                    <span key={badge} className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-xs font-bold flex items-center gap-1">
                                        <Medal className="w-3 h-3" />
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    {reputation?.recentEvents && reputation.recentEvents.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Recent Activity
                            </h4>
                            <div className="space-y-2">
                                {reputation.recentEvents.map((event, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-700/50 last:border-0">
                                        <div>
                                            <span className="text-gray-300">{event.reason}</span>
                                            <span className="text-gray-500 text-xs ml-2">({event.action})</span>
                                        </div>
                                        <span className="text-green-400 font-mono font-bold">+{event.points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Leaderboard */
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-amber-500/10 to-orange-500/10 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">Top Developers</h3>
                    </div>
                    {leaderboard.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No reputation data yet. Start contributing!</div>
                    ) : (
                        <div className="divide-y divide-gray-700/50">
                            {leaderboard.map((entry, i) => {
                                const entryConfig = LEVEL_CONFIG[entry.level] || LEVEL_CONFIG['Junior'];
                                return (
                                    <div key={entry.userId} className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition">
                                        <span className={`text-xl font-black w-8 text-center flex justify-center ${i < 3 ? 'text-amber-400' : 'text-gray-500'}`}>
                                            {i === 0 ? <Medal className="w-6 h-6 text-yellow-400" /> :
                                                i === 1 ? <Medal className="w-6 h-6 text-gray-300" /> :
                                                    i === 2 ? <Medal className="w-6 h-6 text-amber-700" /> :
                                                        i + 1}
                                        </span>
                                        <div className="flex-1">
                                            <span className="text-white font-medium">{entry.userId}</span>
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${entryConfig.color} text-white font-bold inline-flex items-center gap-1`}>
                                                <span className="scale-75">{entryConfig.icon}</span> {entry.level}
                                            </span>
                                        </div>
                                        <span className="text-green-400 font-mono font-bold">{entry.totalPoints} XP</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
