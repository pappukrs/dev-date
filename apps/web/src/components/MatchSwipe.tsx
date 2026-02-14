"use client";

import { useState, useEffect } from "react";

interface Profile {
    githubId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
    techStack: string[];
    devScore: number;
    experienceLevel: string;
}

export default function MatchSwipe({ currentUser }: { currentUser: any }) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [matchModal, setMatchModal] = useState<string | null>(null);

    useEffect(() => {
        fetchPotentialMatches();
    }, []);

    const fetchPotentialMatches = async () => {
        try {
            const res = await fetch(`http://localhost:3000/matches/potential?userId=${currentUser.id || currentUser.githubId}`);
            if (res.ok) {
                const data = await res.json();
                setProfiles(data);
            }
        } catch (err) {
            console.error("Failed to fetch matches", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = async (action: 'LIKE' | 'PASS') => {
        if (currentIndex >= profiles.length) return;

        const currentProfile = profiles[currentIndex];

        // Optimistic UI update
        setCurrentIndex(prev => prev + 1);

        try {
            const res = await fetch(`http://localhost:3000/matches/swipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    swiperId: currentUser.id || currentUser.githubId,
                    swipeeId: currentProfile.githubId,
                    action
                })
            });

            const data = await res.json();

            if (data.match) {
                setMatchModal(currentProfile.displayName);
            }
        } catch (err) {
            console.error("Swipe failed", err);
        }
    };

    if (loading) return <div className="text-center p-10 animate-pulse text-purple-400">Finding developers...</div>;

    if (currentIndex >= profiles.length) {
        return (
            <div className="text-center p-10 bg-gray-800 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold mb-2">No more profiles!</h3>
                <p className="text-gray-400">Check back later for more developers.</p>
                <button onClick={() => { setCurrentIndex(0); fetchPotentialMatches(); }} className="mt-4 text-purple-400 hover:text-purple-300">
                    Refresh
                </button>
            </div>
        );
    }

    const profile = profiles[currentIndex];

    return (
        <div className="relative w-full max-w-md mx-auto perspective-1000">
            {/* Match Modal */}
            {matchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-gradient-to-b from-purple-900 to-black p-8 rounded-2xl border border-purple-500 text-center max-w-sm w-full shadow-2xl shadow-purple-500/50">
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-4 animate-pulse">
                            IT'S A MATCH!
                        </h2>
                        <p className="text-gray-300 mb-6">
                            You and <span className="text-white font-bold">{matchModal}</span> liked each other!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setMatchModal(null)} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition">
                                Keep Swiping
                            </button>
                            <button className="px-6 py-2 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition">
                                Chat Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Card */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl relative group">
                <div className="relative h-96 w-full">
                    <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90" />

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                            {profile.displayName}
                            <span className="text-sm px-2 py-1 bg-purple-500/30 border border-purple-500/50 rounded-full text-purple-300 font-mono">
                                {profile.experienceLevel}
                            </span>
                        </h2>
                        <p className="text-gray-300 line-clamp-2 mb-4">{profile.bio || "No bio yet."}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {profile.techStack.slice(0, 4).map(tech => (
                                <span key={tech} className="text-xs px-2 py-1 bg-gray-800 rounded-md border border-gray-700 text-gray-300">
                                    {tech}
                                </span>
                            ))}
                            {profile.techStack.length > 4 && (
                                <span className="text-xs px-2 py-1 bg-gray-800 rounded-md border border-gray-700 text-gray-300">
                                    +{profile.techStack.length - 4}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-green-400 font-mono text-sm bg-green-900/20 px-3 py-1 rounded-full w-fit">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Dev Score: {profile.devScore}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleSwipe('PASS')}
                        className="flex items-center justify-center py-4 rounded-xl border-2 border-red-500/50 text-red-500 hover:bg-red-500/10 transition active:scale-95"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <button
                        onClick={() => handleSwipe('LIKE')}
                        className="flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-emerald-500 transition active:scale-95"
                    >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
