import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServicePorts, API_PREFIX } from '@dev-date/common';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.GATEWAY;

// Service URLs: use env vars for Docker, fallback to localhost for local dev
const AUTH_URL = process.env.AUTH_URL || `http://localhost:${ServicePorts.AUTH}`;
const PROFILE_URL = process.env.PROFILE_URL || `http://localhost:${ServicePorts.PROFILE}`;
const CHAT_URL = process.env.CHAT_URL || `http://localhost:${ServicePorts.CHAT}`;
const MATCHING_URL = process.env.MATCHING_URL || `http://localhost:${ServicePorts.MATCHING}`;
const COMPATIBILITY_URL = process.env.COMPATIBILITY_URL || `http://localhost:${ServicePorts.COMPATIBILITY}`;
const REPUTATION_URL = process.env.REPUTATION_URL || `http://localhost:${ServicePorts.REPUTATION}`;
const MARKETPLACE_URL = process.env.MARKETPLACE_URL || `http://localhost:${ServicePorts.MARKETPLACE}`;
const MEDIA_URL = process.env.MEDIA_URL || `http://localhost:${ServicePorts.MEDIA}`;

app.use(cors());
app.use(morgan('dev'));

// Proxy routes — rewrite frontend paths to service API_PREFIX paths
app.use('/auth', createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true,
    pathRewrite: { '^/auth': `${API_PREFIX}/auth` }
}));

app.use('/profile', createProxyMiddleware({
    target: PROFILE_URL,
    changeOrigin: true,
    pathRewrite: { '^/profile': `${API_PREFIX}/profile` }
}));

app.use('/chat', createProxyMiddleware({
    target: CHAT_URL,
    changeOrigin: true,
    pathRewrite: { '^/chat': '' },
    ws: true
}));

app.use('/matches', createProxyMiddleware({
    target: MATCHING_URL,
    changeOrigin: true
}));

app.use('/compatibility', createProxyMiddleware({
    target: COMPATIBILITY_URL,
    changeOrigin: true
}));

app.use('/reputation', createProxyMiddleware({
    target: REPUTATION_URL,
    changeOrigin: true
}));

app.use('/marketplace', createProxyMiddleware({
    target: MARKETPLACE_URL,
    changeOrigin: true
}));

app.use('/media', createProxyMiddleware({
    target: MEDIA_URL,
    changeOrigin: true,
    ws: true
}));

app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is healthy' });
});

app.listen(port, () => {
    console.log(`API Gateway listening at http://localhost:${port}`);
});
