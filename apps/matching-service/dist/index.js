"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@dev-date/common");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || common_1.ServicePorts.MATCHING;
const prisma = new client_1.PrismaClient();
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swipe endpoint
app.post('/matches/swipe', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { swiperId, swipeeId, action } = req.body;
        if (!['LIKE', 'PASS'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be LIKE or PASS.' });
        }
        // Check if swipe already exists
        const existingSwipe = yield prisma.swipe.findUnique({
            where: { swiperId_swipeeId: { swiperId, swipeeId } }
        });
        if (existingSwipe) {
            return res.json({ message: 'Already swiped', match: false });
        }
        yield prisma.swipe.create({
            data: { swiperId, swipeeId, action }
        });
        if (action === 'LIKE') {
            // Check for mutual like
            const otherSwipe = yield prisma.swipe.findUnique({
                where: { swiperId_swipeeId: { swiperId: swipeeId, swipeeId: swiperId } }
            });
            if (otherSwipe && otherSwipe.action === 'LIKE') {
                // It's a match!
                const match = yield prisma.match.create({
                    data: {
                        userAId: swiperId < swipeeId ? swiperId : swipeeId, // Canonical ordering
                        userBId: swiperId < swipeeId ? swipeeId : swiperId,
                        status: 'ACCEPTED'
                    }
                });
                // TODO: Emit event to notify users via WebSocket/Chat Service
                return res.json({ message: 'IT IS A MATCH!', match: true, matchId: match.id });
            }
        }
        res.json({ message: 'Swipe recorded', match: false });
    }
    catch (error) {
        console.error('Error processing swipe:', error);
        res.status(500).json({ error: 'Failed to process swipe' });
    }
}));
// Get potential matches
app.get('/matches/potential', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        // fetch all profiles from profile-service
        // In a real app, this would be paginated and filtered heavily
        const response = yield axios_1.default.get(`${PROFILE_SERVICE_URL}/api/v1/profile`);
        const allProfiles = response.data.data; // Unwrap { success, data } wrapper
        // Filter out users already swiped by this user
        const swipes = yield prisma.swipe.findMany({
            where: { swiperId: userId },
            select: { swipeeId: true }
        });
        const swipedIds = new Set(swipes.map((s) => s.swipeeId));
        swipedIds.add(userId); // Exclude self
        const potentialMatches = allProfiles.filter(p => !swipedIds.has(p.githubId));
        res.json(potentialMatches);
    }
    catch (error) {
        console.error('Error fetching potential matches:', error);
        res.status(500).json({ error: 'Failed to fetch potential matches' });
    }
}));
app.get('/health', (req, res) => {
    res.json({ status: 'Matching service is healthy' });
});
app.listen(port, () => {
    console.log(`Matching service listening at http://localhost:${port}`);
});
