import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { User, ServicePorts } from '@dev-date/common';
import { CompatibilityService } from './services/compatibility.service';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.COMPATIBILITY;

app.use(cors());
app.use(express.json());

app.post('/compatibility/score', (req, res) => {
    try {
        const { userA, userB } = req.body;

        if (!userA || !userB) {
            return res.status(400).json({ error: 'Both userA and userB are required' });
        }

        const score = CompatibilityService.calculate(userA as User, userB as User);

        res.json(score);
    } catch (error) {
        console.error('Error calculating compatibility:', error);
        res.status(500).json({ error: 'Failed to calculate compatibility' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Compatibility service is healthy' });
});

app.listen(port, () => {
    console.log(`Compatibility service listening at http://localhost:${port}`);
});
