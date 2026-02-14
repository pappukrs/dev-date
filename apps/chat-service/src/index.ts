import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { ServicePorts } from '@dev-date/common';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

const port = process.env.PORT || ServicePorts.CHAT;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'Chat service is healthy' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`Chat service listening at http://localhost:${port}`);
});
