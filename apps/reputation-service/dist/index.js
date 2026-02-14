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
const reputation_client_1 = require(".prisma/reputation-client");
const common_1 = require("@dev-date/common");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || common_1.ServicePorts.REPUTATION;
const prisma = new reputation_client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Level thresholds
function determineLevel(points) {
    if (points >= 500)
        return 'Legend';
    if (points >= 300)
        return 'Architect';
    if (points >= 100)
        return 'Senior';
    return 'Junior';
}
// Determine badges based on events
function determineBadges(events) {
    const badges = [];
    const actionCounts = {};
    events.forEach(e => {
        actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
    });
    if ((actionCounts['MENTORING'] || 0) >= 5)
        badges.push('Mentor Star');
    if ((actionCounts['BUG_FIX'] || 0) >= 10)
        badges.push('Bug Hunter');
    if ((actionCounts['CONTRIBUTION'] || 0) >= 10)
        badges.push('Open Source Hero');
    if ((actionCounts['HELPING'] || 0) >= 10)
        badges.push('Community Helper');
    if ((actionCounts['CHALLENGE_COMPLETED'] || 0) >= 5)
        badges.push('Challenge Master');
    if ((actionCounts['PROJECT_CREATED'] || 0) >= 3)
        badges.push('Project Creator');
    if (Object.keys(actionCounts).length >= 5)
        badges.push('All-Rounder');
    return badges;
}
// Award reputation points
app.post('/reputation/award', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, action, points, reason } = req.body;
        if (!userId || !action || points === undefined || !reason) {
            return res.status(400).json({ error: 'userId, action, points, and reason are required' });
        }
        // Create the event
        yield prisma.reputationEvent.create({
            data: { userId, action, points, reason }
        });
        // Get all events for this user to calculate totals and badges
        const allEvents = yield prisma.reputationEvent.findMany({
            where: { userId },
            select: { points: true, action: true }
        });
        const totalPoints = allEvents.reduce((sum, e) => sum + e.points, 0);
        const level = determineLevel(totalPoints);
        const badges = determineBadges(allEvents);
        // Upsert the aggregate reputation
        const reputation = yield prisma.userReputation.upsert({
            where: { userId },
            update: { totalPoints, level, badges },
            create: { userId, totalPoints, level, badges }
        });
        res.json({
            success: true,
            data: reputation
        });
    }
    catch (error) {
        console.error('Error awarding reputation:', error);
        res.status(500).json({ error: 'Failed to award reputation' });
    }
}));
// Get user reputation
app.get('/reputation/leaderboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const leaderboard = yield prisma.userReputation.findMany({
            orderBy: { totalPoints: 'desc' },
            take: limit
        });
        res.json({
            success: true,
            data: leaderboard
        });
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
}));
// Get user reputation by userId
app.get('/reputation/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        let reputation = yield prisma.userReputation.findUnique({
            where: { userId }
        });
        if (!reputation) {
            // Return a default Junior reputation
            return res.json({
                success: true,
                data: {
                    userId,
                    totalPoints: 0,
                    level: 'Junior',
                    badges: []
                }
            });
        }
        // Also fetch recent events
        const recentEvents = yield prisma.reputationEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, reputation), { recentEvents })
        });
    }
    catch (error) {
        console.error('Error fetching reputation:', error);
        res.status(500).json({ error: 'Failed to fetch reputation' });
    }
}));
app.get('/health', (req, res) => {
    res.json({ status: 'Reputation service is healthy' });
});
app.listen(port, () => {
    console.log(`Reputation service listening at http://localhost:${port}`);
});
