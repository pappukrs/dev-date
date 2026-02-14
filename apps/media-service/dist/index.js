"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const uuid_1 = require("uuid");
const common_1 = require("@dev-date/common");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || common_1.ServicePorts.MEDIA;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: '/media/socket.io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const rooms = new Map();
// REST: Create a room
app.post('/media/rooms', (req, res) => {
    const { name, createdBy } = req.body;
    if (!name || !createdBy) {
        return res.status(400).json({ error: 'name and createdBy are required' });
    }
    const roomId = (0, uuid_1.v4)().slice(0, 8);
    const room = {
        id: roomId,
        name,
        createdBy,
        participants: new Map(),
        createdAt: new Date()
    };
    rooms.set(roomId, room);
    res.status(201).json({
        success: true,
        data: {
            id: room.id,
            name: room.name,
            createdBy: room.createdBy,
            participantCount: 0,
            createdAt: room.createdAt
        }
    });
});
// REST: Get room info
app.get('/media/rooms/:id', (req, res) => {
    const room = rooms.get(req.params.id);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    const participants = Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        displayName: p.displayName
    }));
    res.json({
        success: true,
        data: {
            id: room.id,
            name: room.name,
            createdBy: room.createdBy,
            participants,
            participantCount: participants.length,
            createdAt: room.createdAt
        }
    });
});
// REST: List active rooms
app.get('/media/rooms', (req, res) => {
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        createdBy: room.createdBy,
        participantCount: room.participants.size,
        createdAt: room.createdAt
    }));
    res.json({
        success: true,
        data: roomList
    });
});
app.get('/health', (req, res) => {
    res.json({ status: 'Media service is healthy' });
});
// Socket.IO: WebRTC Signaling
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    // Join a room
    socket.on('join-room', ({ roomId, userId, displayName }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        // Add participant
        room.participants.set(socket.id, { socketId: socket.id, userId, displayName });
        socket.join(roomId);
        // Notify existing participants about the new user
        socket.to(roomId).emit('user-joined', {
            socketId: socket.id,
            userId,
            displayName
        });
        // Send the list of existing participants to the joining user
        const existingParticipants = Array.from(room.participants.entries())
            .filter(([sid]) => sid !== socket.id)
            .map(([sid, p]) => ({
            socketId: sid,
            userId: p.userId,
            displayName: p.displayName
        }));
        socket.emit('room-participants', existingParticipants);
        console.log(`${displayName} (${userId}) joined room ${roomId}`);
    });
    // Relay WebRTC offer
    socket.on('offer', ({ to, offer }) => {
        socket.to(to).emit('offer', {
            from: socket.id,
            offer
        });
    });
    // Relay WebRTC answer
    socket.on('answer', ({ to, answer }) => {
        socket.to(to).emit('answer', {
            from: socket.id,
            answer
        });
    });
    // Relay ICE candidate
    socket.on('ice-candidate', ({ to, candidate }) => {
        socket.to(to).emit('ice-candidate', {
            from: socket.id,
            candidate
        });
    });
    // Leave room
    socket.on('leave-room', ({ roomId }) => {
        handleLeave(socket, roomId);
    });
    // Disconnect
    socket.on('disconnect', () => {
        // Find and remove from all rooms
        for (const [roomId, room] of rooms.entries()) {
            if (room.participants.has(socket.id)) {
                handleLeave(socket, roomId);
            }
        }
        console.log(`Socket disconnected: ${socket.id}`);
    });
});
function handleLeave(socket, roomId) {
    const room = rooms.get(roomId);
    if (!room)
        return;
    const participant = room.participants.get(socket.id);
    if (!participant)
        return;
    room.participants.delete(socket.id);
    socket.leave(roomId);
    // Notify others
    socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        userId: participant.userId,
        displayName: participant.displayName
    });
    // Clean up empty rooms
    if (room.participants.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
    }
}
server.listen(port, () => {
    console.log(`Media service listening at http://localhost:${port}`);
});
