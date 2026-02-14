"use client";

import { useState, useEffect } from "react";
import { CopyPlus, ClipboardList, Rocket, Tag, CheckCircle2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Post {
    id: string;
    authorId: string;
    title: string;
    description: string;
    tags: string[];
    status: string;
    createdAt: string;
    applications?: { id: string; applicantId: string; status: string }[];
}

export default function ProjectMarketplace({ currentUser }: { currentUser: any }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', description: '', tags: '' });
    const [applyingTo, setApplyingTo] = useState<string | null>(null);
    const [applyMessage, setApplyMessage] = useState('');

    const userId = currentUser?.id || currentUser?.githubId;

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_BASE}/marketplace/posts`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoading(false);
        }
    };

    const createPost = async () => {
        if (!newPost.title || !newPost.description) return;
        try {
            const res = await fetch(`${API_BASE}/marketplace/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authorId: userId,
                    title: newPost.title,
                    description: newPost.description,
                    tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });
            if (res.ok) {
                setNewPost({ title: '', description: '', tags: '' });
                setShowCreate(false);
                fetchPosts();
            }
        } catch (err) {
            console.error("Failed to create post", err);
        }
    };

    const applyToPost = async (postId: string) => {
        if (!applyMessage) return;
        try {
            const res = await fetch(`${API_BASE}/marketplace/posts/${postId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId: userId, message: applyMessage })
            });
            if (res.ok) {
                setApplyingTo(null);
                setApplyMessage('');
                fetchPosts();
            }
        } catch (err) {
            console.error("Failed to apply", err);
        }
    };

    const TAG_COLORS = [
        'border-blue-500/30 text-blue-300 bg-blue-500/10',
        'border-green-500/30 text-green-300 bg-green-500/10',
        'border-purple-500/30 text-purple-300 bg-purple-500/10',
        'border-pink-500/30 text-pink-300 bg-pink-500/10',
        'border-amber-500/30 text-amber-300 bg-amber-500/10',
    ];

    if (loading) return <div className="text-center p-10 animate-pulse text-purple-400">Loading projects...</div>;

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Project Marketplace</h2>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-sm transition flex items-center gap-2"
                >
                    <CopyPlus className="w-4 h-4" />
                    {showCreate ? 'Cancel' : 'New Project'}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-gray-800 rounded-xl p-6 border border-purple-500/30 space-y-4">
                    <input
                        type="text"
                        placeholder="Project title"
                        value={newPost.title}
                        onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
                    />
                    <textarea
                        placeholder="Describe what you're looking for..."
                        value={newPost.description}
                        onChange={e => setNewPost({ ...newPost, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none transition"
                    />
                    <div className="relative">
                        <Tag className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tags (comma separated, e.g. React, Node.js, Startup)"
                            value={newPost.tags}
                            onChange={e => setNewPost({ ...newPost, tags: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
                        />
                    </div>
                    <button
                        onClick={createPost}
                        disabled={!newPost.title || !newPost.description}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold transition disabled:opacity-50"
                    >
                        Post Project
                    </button>
                </div>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-10 text-center border border-gray-700 flex flex-col items-center">
                    <ClipboardList className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-1">No Projects Yet</h3>
                    <p className="text-gray-400 text-sm">Be the first to post a collaboration need!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => {
                        const isOwner = post.authorId === userId;
                        const hasApplied = post.applications?.some(a => a.applicantId === userId);

                        return (
                            <div key={post.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white">{post.title}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${post.status === 'OPEN'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                            {post.status}
                                        </span>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-3 line-clamp-3">{post.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {post.tags.map((tag, i) => (
                                            <span key={tag} className={`text-xs px-2 py-1 rounded-md border font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>by {isOwner ? 'You' : post.authorId}</span>
                                        <span>{post.applications?.length || 0} applicant{(post.applications?.length || 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {post.status === 'OPEN' && !isOwner && !hasApplied && (
                                    <div className="border-t border-gray-700 p-4">
                                        {applyingTo === post.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    placeholder="Why do you want to join this project?"
                                                    value={applyMessage}
                                                    onChange={e => setApplyMessage(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => applyToPost(post.id)}
                                                        disabled={!applyMessage}
                                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm transition disabled:opacity-50"
                                                    >
                                                        Submit Application
                                                    </button>
                                                    <button
                                                        onClick={() => { setApplyingTo(null); setApplyMessage(''); }}
                                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setApplyingTo(post.id)}
                                                className="w-full py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 rounded-lg font-bold text-sm transition"
                                            >
                                                Apply to Collaborate
                                            </button>
                                        )}
                                    </div>
                                )}

                                {hasApplied && (
                                    <div className="border-t border-gray-700 px-5 py-3 text-center text-sm text-green-400 bg-green-500/5 flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Applied
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
