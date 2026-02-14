import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '.prisma/reputation-client';
import { ServicePorts } from '@dev-date/common';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.REPUTATION;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Level thresholds
function determineLevel(points: number): string {
    if (points >= 500) return 'Legend';
    if (points >= 300) return 'Architect';
    if (points >= 100) return 'Senior';
    return 'Junior';
}

// Determine badges based on events
function determineBadges(events: { action: string }[]): string[] {
    const badges: string[] = [];
    const actionCounts: Record<string, number> = {};

    events.forEach(e => {
        actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
    });

    if ((actionCounts['MENTORING'] || 0) >= 5) badges.push('Mentor Star');
    if ((actionCounts['BUG_FIX'] || 0) >= 10) badges.push('Bug Hunter');
    if ((actionCounts['CONTRIBUTION'] || 0) >= 10) badges.push('Open Source Hero');
    if ((actionCounts['HELPING'] || 0) >= 10) badges.push('Community Helper');
    if ((actionCounts['CHALLENGE_COMPLETED'] || 0) >= 5) badges.push('Challenge Master');
    if ((actionCounts['PROJECT_CREATED'] || 0) >= 3) badges.push('Project Creator');
    if (Object.keys(actionCounts).length >= 5) badges.push('All-Rounder');

    return badges;
}

// Award reputation points
app.post('/reputation/award', async (req, res) => {
    try {
        const { userId, action, points, reason } = req.body;

        if (!userId || !action || points === undefined || !reason) {
            return res.status(400).json({ error: 'userId, action, points, and reason are required' });
        }

        // Create the event
        await prisma.reputationEvent.create({
            data: { userId, action, points, reason }
        });

        // Get all events for this user to calculate totals and badges
        const allEvents = await prisma.reputationEvent.findMany({
            where: { userId },
            select: { points: true, action: true }
        });

        const totalPoints = allEvents.reduce((sum: number, e: { points: number }) => sum + e.points, 0);
        const level = determineLevel(totalPoints);
        const badges = determineBadges(allEvents);

        // Upsert the aggregate reputation
        const reputation = await prisma.userReputation.upsert({
            where: { userId },
            update: { totalPoints, level, badges },
            create: { userId, totalPoints, level, badges }
        });

        res.json({
            success: true,
            data: reputation
        });
    } catch (error) {
        console.error('Error awarding reputation:', error);
        res.status(500).json({ error: 'Failed to award reputation' });
    }
});

// Get user reputation
app.get('/reputation/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;

        const leaderboard = await prisma.userReputation.findMany({
            orderBy: { totalPoints: 'desc' },
            take: limit
        });

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get user reputation by userId
app.get('/reputation/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        let reputation = await prisma.userReputation.findUnique({
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
        const recentEvents = await prisma.reputationEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        res.json({
            success: true,
            data: { ...reputation, recentEvents }
        });
    } catch (error) {
        console.error('Error fetching reputation:', error);
        res.status(500).json({ error: 'Failed to fetch reputation' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Reputation service is healthy' });
});

app.listen(port, () => {
    console.log(`Reputation service listening at http://localhost:${port}`);
});
