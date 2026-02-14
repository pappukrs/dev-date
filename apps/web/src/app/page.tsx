"use client";

import { useState, useEffect } from "react";
import MatchSwipe from "../components/MatchSwipe";
import DatingToggle from "../components/DatingToggle";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [datingMode, setDatingMode] = useState(false);

  useEffect(() => {
    // Check for token in URL (from auth callback)
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
      const res = await fetch('http://localhost:3000/auth/me', {
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
      const res = await fetch(`http://localhost:3000/profile/sync/${user.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      alert(`Profile Synced! Dev Score: ${data.data.devScore}`);
      fetchUser(); // Refresh user data
    } catch (err) {
      alert('Failed to sync');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-10">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Dev-Date &nbsp;
          <code className="font-mono font-bold">Phase 2</code>
        </p>

        {user && (
          <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
            <DatingToggle enabled={datingMode} onToggle={setDatingMode} />
          </div>
        )}
      </div>

      <div className="relative flex place-items-center flex-col gap-8 w-full">
        {!user ? (
          <>
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Dev-Date
            </h1>
            <p className="text-xl text-gray-400">Where developers connect &lt;3</p>
            <a
              href="http://localhost:3000/auth/github"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold border border-gray-700 transition flex items-center gap-3"
            >
              Login with GitHub
            </a>
          </>
        ) : datingMode ? (
          <MatchSwipe currentUser={user} />
        ) : (
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <img src={user.avatarUrl} alt={user.username} className="w-16 h-16 rounded-full border-2 border-purple-500" />
              <div>
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <p className="text-gray-400">@{user.username}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg">
                <span>Dev Score</span>
                <span className="text-2xl font-bold text-green-400">{user.devScore || '?'}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg">
                <span>Level</span>
                <span className="text-xl text-blue-400">{user.experienceLevel}</span>
              </div>

              <button
                onClick={syncProfile}
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition disabled:opacity-50"
              >
                {loading ? 'Analyzing GitHub...' : 'Recalculate Score'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      </div>
    </main>
  );
}
