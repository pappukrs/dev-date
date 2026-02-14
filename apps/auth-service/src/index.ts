import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ServicePorts } from '@dev-date/common';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.AUTH;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'Auth service is healthy' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Auth Service' });
});

app.listen(port, () => {
    console.log(`Auth service listening at http://localhost:${port}`);
});
