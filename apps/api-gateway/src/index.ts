import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServicePorts } from '@dev-date/common';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.GATEWAY;

app.use(cors());
app.use(morgan('dev'));

// Proxy routes
app.use('/auth', createProxyMiddleware({
    target: `http://localhost:${ServicePorts.AUTH}`,
    changeOrigin: true,
    pathRewrite: { '^/auth': '' }
}));

app.use('/profile', createProxyMiddleware({
    target: `http://localhost:${ServicePorts.PROFILE}`,
    changeOrigin: true,
    pathRewrite: { '^/profile': '' }
}));

app.use('/chat', createProxyMiddleware({
    target: `http://localhost:${ServicePorts.CHAT}`,
    changeOrigin: true,
    pathRewrite: { '^/chat': '' },
    ws: true
}));

app.use('/matches', createProxyMiddleware({
    target: `http://localhost:3003`,
    changeOrigin: true
}));

app.use('/compatibility', createProxyMiddleware({
    target: `http://localhost:3004`,
    changeOrigin: true
}));

app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is healthy' });
});

app.listen(port, () => {
    console.log(`API Gateway listening at http://localhost:${port}`);
});
