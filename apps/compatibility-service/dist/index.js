"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const common_1 = require("@dev-date/common");
const compatibility_service_1 = require("./services/compatibility.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || common_1.ServicePorts.COMPATIBILITY;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/compatibility/score', (req, res) => {
    try {
        const { userA, userB } = req.body;
        if (!userA || !userB) {
            return res.status(400).json({ error: 'Both userA and userB are required' });
        }
        const score = compatibility_service_1.CompatibilityService.calculate(userA, userB);
        res.json(score);
    }
    catch (error) {
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
