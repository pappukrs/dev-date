import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
const prisma = new PrismaClient();
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());

// Swipe endpoint
app.post('/matches/swipe', async (req, res) => {
    try {
        const { swiperId, swipeeId, action } = req.body;

        if (!['LIKE', 'PASS'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be LIKE or PASS.' });
        }

        // Check if swipe already exists
        const existingSwipe = await prisma.swipe.findUnique({
            where: { swiperId_swipeeId: { swiperId, swipeeId } }
        });

        if (existingSwipe) {
            return res.json({ message: 'Already swiped', match: false });
        }

        await prisma.swipe.create({
            data: { swiperId, swipeeId, action }
        });

        if (action === 'LIKE') {
            // Check for mutual like
            const otherSwipe = await prisma.swipe.findUnique({
                where: { swiperId_swipeeId: { swiperId: swipeeId, swipeeId: swiperId } }
            });

            if (otherSwipe && otherSwipe.action === 'LIKE') {
                // It's a match!
                const match = await prisma.match.create({
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
    } catch (error) {
        console.error('Error processing swipe:', error);
        res.status(500).json({ error: 'Failed to process swipe' });
    }
});

// Get potential matches
app.get('/matches/potential', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // fetch all profiles from profile-service
        // In a real app, this would be paginated and filtered heavily
        const response = await axios.get(`${PROFILE_SERVICE_URL}/profiles`);
        const allProfiles: any[] = response.data; // Type assertion

        // Filter out users already swiped by this user
        const swipes = await prisma.swipe.findMany({
            where: { swiperId: userId as string },
            select: { swipeeId: true }
        });

        const swipedIds = new Set(swipes.map(s => s.swipeeId));
        swipedIds.add(userId as string); // Exclude self

        const potentialMatches = allProfiles.filter(p => !swipedIds.has(p.githubId));

        res.json(potentialMatches);
    } catch (error) {
        console.error('Error fetching potential matches:', error);
        res.status(500).json({ error: 'Failed to fetch potential matches' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Matching service is healthy' });
});

app.listen(port, () => {
    console.log(`Matching service listening at http://localhost:${port}`);
});
