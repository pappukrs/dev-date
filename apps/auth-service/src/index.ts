import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import { ServicePorts, API_PREFIX } from '@dev-date/common';
import { UserModel } from './models/user.model';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.AUTH;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Database Initialization
UserModel.createTable().then(() => {
    console.log('User table ensured');
}).catch(err => {
    console.error('Failed to init DB:', err);
});

// Passport Setup
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'placeholder_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder_secret',
    callbackURL: process.env.GITHUB_CALLBACK_URL || `http://localhost:${port}${API_PREFIX}/auth/github/callback`
},
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
        try {
            let user = await UserModel.findByGithubId(profile.id);

            if (!user) {
                user = await UserModel.create({
                    githubId: profile.id,
                    username: profile.username,
                    displayName: profile.displayName || profile.username,
                    avatarUrl: profile.photos?.[0]?.value || '',
                    bio: profile._json?.bio || '',
                    techStack: [], // Will be populated by profile-service
                    devScore: 0,
                    experienceLevel: 'Junior'
                });
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Routes
const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'read:user'] }));

router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = jwt.sign(
            { id: user.id, username: user.username, githubId: user.githubId },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '7d' }
        );

        // Redirect to frontend with token
        // In production, better to use a secure cookie or postMessage
        res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
    }
);

router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
        const user = await UserModel.findByGithubId(decoded.githubId);
        res.json({ user });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.use(`${API_PREFIX}/auth`, router);

app.get('/health', (req, res) => {
    res.json({ status: 'Auth service is healthy' });
});

app.listen(port, () => {
    console.log(`Auth service listening at http://localhost:${port}`);
});
