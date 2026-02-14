"use client";

import { useState, useEffect } from "react";
import { Heart, Trophy, Code2 } from "lucide-react";
import MatchSwipe from "../components/MatchSwipe";
import DatingToggle from "../components/DatingToggle";
import ReputationBadge from "../components/ReputationBadge";
import ProjectMarketplace from "../components/ProjectMarketplace";
import PairProgramming from "../components/PairProgramming";
import Header from "../components/Header";
import Hero from "../components/Hero";
import FloatingDock from "../components/FloatingDock";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Tab = 'dashboard' | 'dating' | 'reputation' | 'marketplace' | 'pairing';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        setToken(urlToken);
        window.history.replaceState({}, document.title, "/");
      } else {
        setToken(localStorage.getItem('token'));
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profile/sync/${user.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      alert(`Profile Synced! Dev Score: ${data.data.devScore}`);
      fetchUser();
    } catch (err) {
      console.error(err);
      alert('Failed to sync');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dating':
        return <MatchSwipe currentUser={user} />;
      case 'reputation':
        return <ReputationBadge currentUser={user} />;
      case 'marketplace':
        return <ProjectMarketplace currentUser={user} />;
      case 'pairing':
        return <PairProgramming currentUser={user} />;
      default:
        // Dashboard
        return (
          <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[50px] -z-10 group-hover:bg-purple-500/30 transition-all"></div>

                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <img src={user.avatarUrl} alt={user.username} className="w-24 h-24 rounded-2xl border-2 border-white/10 shadow-2xl" />
                    <div className="absolute -bottom-2 -right-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-700 text-xs font-bold text-white">
                      Lvl {user.devScore ? Math.floor(user.devScore / 100) + 1 : 1}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{user.displayName}</h2>
                    <p className="text-purple-400 font-mono">@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                    <span className="text-gray-400">Dev Score</span>
                    <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">{user.devScore || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                    <span className="text-gray-400">Experience</span>
                    <span className="text-xl font-bold text-blue-400">{user.experienceLevel || 'Junior'}</span>
                  </div>
                </div>

                <button
                  onClick={syncProfile}
                  disabled={loading}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? 'Resyncing with GitHub...' : 'Sync GitHub Stats'}
                </button>
              </div>

              {/* Quick Actions / Stats */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-6 rounded-3xl border border-pink-500/20 hover:border-pink-500/40 transition cursor-pointer group" onClick={() => setActiveTab('dating')}>
                  <div className="mb-4 w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Heart className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Find a Match</h3>
                  <p className="text-gray-400 text-sm mt-1">Swipe through developer profiles</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 rounded-3xl border border-amber-500/20 hover:border-amber-500/40 transition cursor-pointer group" onClick={() => setActiveTab('reputation')}>
                  <div className="mb-4 w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                  <p className="text-gray-400 text-sm mt-1">Check your ranking</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 rounded-3xl border border-cyan-500/20 hover:border-cyan-500/40 transition cursor-pointer group" onClick={() => setActiveTab('pairing')}>
                  <div className="mb-4 w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Code2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pair Program</h3>
                  <p className="text-gray-400 text-sm mt-1">Join a live coding room</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
      <Header user={user} />

      <div className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center">
        {!user ? (
          <Hero />
        ) : (
          <div className="w-full flex justify-center animate-in fade-in duration-700">
            {renderTabContent()}
          </div>
        )}
      </div>

      {user && <FloatingDock activeTab={activeTab} onTabChange={setActiveTab} />}
    </main>
  );
}
