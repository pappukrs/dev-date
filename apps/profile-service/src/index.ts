import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ServicePorts } from '@dev-date/common';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.PROFILE;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'Profile service is healthy' });
});

app.listen(port, () => {
    console.log(`Profile service listening at http://localhost:${port}`);
});
