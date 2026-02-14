"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Code2, Hand, Users, Copy, Activity } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SOCKET_URL = API_BASE;
const SOCKET_PATH = '/media/socket.io';

interface RoomInfo {
    id: string;
    name: string;
    participantCount: number;
    createdBy: string;
    participants?: Participant[];
}

interface Participant {
    socketId: string;
    userId: string;
    displayName: string;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export default function PairProgramming({ currentUser }: { currentUser: any }) {
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [inRoom, setInRoom] = useState<string | null>(null);
    const [roomInfo, setRoomInfo] = useState<any>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [micEnabled, setMicEnabled] = useState(true);
    const [camEnabled, setCamEnabled] = useState(true);

    // UI State for video controls
    const [maximizedStreamId, setMaximizedStreamId] = useState<string | null>(null); // 'local' or socketId
    const [videoFitModes, setVideoFitModes] = useState<Map<string, 'cover' | 'contain'>>(new Map());

    const userId = currentUser?.id || currentUser?.githubId;
    const displayName = currentUser?.displayName || currentUser?.username || 'Anonymous';

    // WebRTC Refs
    const socketRef = useRef<Socket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        fetchRooms();
        return () => {
            cleanup();
        };
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch(`${API_BASE}/media/rooms`);
            if (res.ok) {
                const data = await res.json();
                setRooms(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        } finally {
            setLoading(false);
        }
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());
        setMaximizedStreamId(null);
        setVideoFitModes(new Map());
    };

    const initializeSocket = (roomId: string) => {
        if (socketRef.current) return;

        socketRef.current = io(SOCKET_URL, {
            path: SOCKET_PATH,
            transports: ['websocket', 'polling']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log("Connected to Media Service", socket.id);
            socket.emit('join-room', { roomId, userId, displayName });
        });

        socket.on('room-participants', async (participants: Participant[]) => {
            for (const p of participants) {
                createPeerConnection(p.socketId, p.displayName, true);
            }
        });

        socket.on('user-joined', ({ socketId, displayName }: { socketId: string, displayName: string }) => {
            console.log("User joined:", displayName);
        });

        socket.on('offer', async ({ from, offer }: { from: string, offer: RTCSessionDescriptionInit }) => {
            const pc = createPeerConnection(from, "Peer", false);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { to: from, answer });
        });

        socket.on('answer', async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
            const pc = peersRef.current.get(from);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('ice-candidate', async ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
            const pc = peersRef.current.get(from);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            }
        });

        socket.on('user-left', ({ socketId }: { socketId: string }) => {
            if (peersRef.current.has(socketId)) {
                peersRef.current.get(socketId)?.close();
                peersRef.current.delete(socketId);
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(socketId);
                    return newMap;
                });
                if (maximizedStreamId === socketId) {
                    setMaximizedStreamId(null);
                }
            }
        });
    };

    const createPeerConnection = (targetSocketId: string, targetName: string, initiator: boolean) => {
        if (peersRef.current.has(targetSocketId)) return peersRef.current.get(targetSocketId)!;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current.set(targetSocketId, pc);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetSocketId, remoteStream);
                return newMap;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', {
                    to: targetSocketId,
                    candidate: event.candidate
                });
            }
        };

        if (initiator) {
            (async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current?.emit('offer', { to: targetSocketId, offer });
                } catch (e) {
                    console.error("Error creating offer", e);
                }
            })();
        }

        return pc;
    };

    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return true;
        } catch (err) {
            console.error("Failed to get local stream", err);
            alert("Could not access camera/microphone. Please check permissions.");
            return false;
        }
    };

    const joinRoomWrapper = async (roomId: string, data?: any) => {
        const streamSuccess = await startLocalStream();
        if (!streamSuccess) return;

        initializeSocket(roomId);

        if (!data) {
            const res = await fetch(`${API_BASE}/media/rooms/${roomId}`);
            if (res.ok) {
                const json = await res.json();
                setRoomInfo(json.data);
            }
        } else {
            setRoomInfo(data);
        }

        setInRoom(roomId);
    };

    const createRoom = async () => {
        if (!roomName) return;
        try {
            const res = await fetch(`${API_BASE}/media/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: roomName, createdBy: userId })
            });
            if (res.ok) {
                const data = await res.json();
                setRoomName('');
                setShowCreate(false);
                fetchRooms();
                await joinRoomWrapper(data.data.id, data.data);
            }
        } catch (err) {
            console.error("Failed to create room", err);
        }
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleCam = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCamEnabled(videoTrack.enabled);
            }
        }
    };

    const shareScreen = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            peersRef.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream;
            }

            screenTrack.onended = () => {
                if (localStreamRef.current) {
                    const originalTrack = localStreamRef.current.getVideoTracks()[0];
                    peersRef.current.forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender && originalTrack) {
                            sender.replaceTrack(originalTrack);
                        }
                    });
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = localStreamRef.current;
                    }
                }
            };

        } catch (err) {
            console.error("Failed to share screen", err);
        }
    };

    const toggleVideoFit = (id: string) => {
        setVideoFitModes(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id) || 'cover';
            newMap.set(id, current === 'cover' ? 'contain' : 'cover');
            return newMap;
        });
    };

    // Helper component to play remote video with controls
    const VideoContainer = ({ stream, name, id, isLocal = false }: { stream: MediaStream | null, name: string, id: string, isLocal?: boolean }) => {
        const videoRef = useRef<HTMLVideoElement>(null);

        useEffect(() => {
            if (videoRef.current && stream) {
                videoRef.current.srcObject = stream;
            }
        }, [stream]);

        const isMaximized = maximizedStreamId === id;
        const fitMode = videoFitModes.get(id) || 'cover';

        const handleMaximize = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMaximizedStreamId(isMaximized ? null : id);
        };

        const handleFitToggle = (e: React.MouseEvent) => {
            e.stopPropagation();
            toggleVideoFit(id);
        };

        return (
            <div
                className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden shadow-lg transition-all duration-300 group ${isMaximized
                    ? 'fixed inset-4 z-50 shadow-2xl border-purple-500/50'
                    : 'aspect-video'
                    }`}
            >
                {stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal} // Mute local to prevent echo
                        className={`w-full h-full ${fitMode === 'contain' ? 'object-contain bg-black' : 'object-cover'} ${isLocal && !isMaximized ? 'transform -scale-x-100' : ''}`}
                    />
                ) : (
                    <div className="text-gray-500">No Signal</div>
                )}

                {/* Overlay Controls (visible on hover or if maximized) */}
                <div className={`absolute top-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isMaximized ? 'opacity-100' : ''}`}>
                    <button
                        onClick={handleFitToggle}
                        className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition"
                        title={fitMode === 'cover' ? "Fit to screen" : "Fill screen"}
                    >
                        {fitMode === 'cover' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.2l.1-.1M7 16v4h4.1l-.1-.1M17 14l5-5-5 5zm0 0l5 5-5-5z" /></svg>
                        )}
                    </button>
                    <button
                        onClick={handleMaximize}
                        className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition"
                        title={isMaximized ? "Minimize" : "Maximize"}
                    >
                        {isMaximized ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        )}
                    </button>
                </div>

                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                    {!isLocal && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                    <span>{name}</span>
                    {isLocal && !micEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-center p-10 animate-pulse text-purple-400">Loading rooms...</div>;

    // In-Room View
    if (inRoom && roomInfo) {
        return (
            <div className={`w-full mx-auto space-y-4 ${maximizedStreamId ? 'max-w-none px-4 h-screen fixed inset-0 bg-gray-900 z-40 flex flex-col' : 'max-w-6xl'}`}>
                {/* Room Header - Hide if maximized to give more space, or show minimal */}
                {!maximizedStreamId && (
                    <div className="flex justify-between items-center bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-purple-400" />
                                {roomInfo.name}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                                Room ID: <code className="bg-gray-700 px-2 py-0.5 rounded text-purple-300 font-mono text-xs">{roomInfo.id}</code>
                            </p>
                        </div>
                        <button
                            onClick={() => { cleanup(); setInRoom(null); setRoomInfo(null); fetchRooms(); }}
                            className="px-4 py-2 bg-red-600/10 text-red-400 border border-red-500/30 hover:bg-red-600/20 rounded-lg font-bold text-sm transition flex items-center gap-2"
                        >
                            <PhoneOff className="w-4 h-4" />
                            Leave Room
                        </button>
                    </div>
                )}

                {/* Video Grid */}
                <div className={`grid gap-4 ${maximizedStreamId ? 'flex 1 h-full' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>

                    {/* Local Video - Updated to use VideoContainer */}
                    <VideoContainer
                        stream={localStreamRef.current}
                        name={`${displayName} (You)`}
                        id="local"
                        isLocal={true}
                    />

                    {/* Remote Videos - Updated to use VideoContainer */}
                    {Array.from(remoteStreams.entries()).map(([sid, stream]) => (
                        <VideoContainer
                            key={sid}
                            stream={stream}
                            name={`Peer (${sid.slice(0, 4)})`}
                            id={sid}
                        />
                    ))}

                    {/* Empty Slots - Hide if maximized */}
                    {!maximizedStreamId && remoteStreams.size === 0 && (
                        <div className="aspect-video bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700/50 flex flex-col items-center justify-center gap-3 text-gray-500">
                            <Hand className="w-10 h-10 animate-bounce" />
                            <div className="text-center">
                                <p className="font-medium">Waiting for peers...</p>
                                <p className="text-xs mt-1">Share ID to invite others</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className={`flex justify-center gap-4 bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-xl ${maximizedStreamId ? 'fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl border-white/10' : ''}`}>
                    <button onClick={toggleCam} className={`p-4 rounded-full transition ${camEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30'}`} title="Toggle Video">
                        {camEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                    <button onClick={toggleMic} className={`p-4 rounded-full transition ${micEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30'}`} title="Toggle Audio">
                        {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>
                    <button onClick={shareScreen} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition text-white" title="Share Screen">
                        <MonitorUp className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => { cleanup(); setInRoom(null); setRoomInfo(null); fetchRooms(); }}
                        className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition text-white shadow-lg shadow-red-500/30"
                        title="End Call"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }

    // Room Lobby View
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-purple-500/10 mb-4">
                    <Code2 className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Pair Programming</h2>
                <p className="text-gray-400 text-sm">Real-time video & coding collaboration</p>
            </div>

            {/* Quick Join */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Enter Room ID to join..."
                        value={joinRoomId}
                        onChange={e => setJoinRoomId(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition font-mono"
                    />
                    <button
                        onClick={() => { if (joinRoomId) joinRoomWrapper(joinRoomId); }}
                        disabled={!joinRoomId}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-bold text-sm transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
                    >
                        Join Room
                    </button>
                </div>
            </div>

            {/* Create Room */}
            {showCreate ? (
                <div className="bg-gray-800 rounded-xl p-6 border border-purple-500/30 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        Create New Room
                    </h3>
                    <input
                        type="text"
                        placeholder="Room name (e.g. 'React Debugging Session')"
                        value={roomName}
                        onChange={e => setRoomName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={createRoom}
                            disabled={!roomName}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
                        >
                            Start Session
                        </button>
                        <button
                            onClick={() => { setShowCreate(false); setRoomName(''); }}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowCreate(true)}
                    className="w-full py-6 bg-gray-800/50 border-2 border-dashed border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 rounded-xl font-bold text-gray-400 hover:text-white transition flex flex-col items-center gap-2 group"
                >
                    <div className="p-3 rounded-full bg-gray-800 group-hover:bg-purple-500/20 transition">
                        <Video className="w-6 h-6 group-hover:text-purple-400 transition" />
                    </div>
                    <span>Create New Session</span>
                </button>
            )}

            {/* Active Rooms */}
            {rooms.length > 0 && (
                <div className="space-y-4 pt-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Active Sessions
                    </h3>
                    <div className="grid gap-4">
                        {rooms.map(room => (
                            <div key={room.id} className="group flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-purple-500/30 transition shadow-sm hover:shadow-lg hover:shadow-purple-500/5">
                                <div>
                                    <h4 className="text-white font-bold text-lg group-hover:text-purple-300 transition">{room.name}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            {room.participantCount} online
                                        </span>
                                        <span className="text-gray-600">·</span>
                                        <code className="text-gray-500 text-xs flex items-center gap-1 cursor-pointer hover:text-white transition" title="Copy ID">
                                            {room.id} <Copy className="w-3 h-3" />
                                        </code>
                                    </div>
                                </div>
                                <button
                                    onClick={() => joinRoomWrapper(room.id)}
                                    className="px-6 py-2.5 bg-gray-700 text-white hover:bg-purple-600 rounded-lg font-bold text-sm transition group-hover:shadow-lg"
                                >
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
