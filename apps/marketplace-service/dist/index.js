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
const marketplace_client_1 = require(".prisma/marketplace-client");
const common_1 = require("@dev-date/common");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || common_1.ServicePorts.MARKETPLACE;
const prisma = new marketplace_client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Create a project post
app.post('/marketplace/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { authorId, title, description, tags } = req.body;
        if (!authorId || !title || !description) {
            return res.status(400).json({ error: 'authorId, title, and description are required' });
        }
        const post = yield prisma.projectPost.create({
            data: {
                authorId,
                title,
                description,
                tags: tags || []
            }
        });
        res.status(201).json({
            success: true,
            data: post
        });
    }
    catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
}));
// List all open posts (with optional tag filter)
app.get('/marketplace/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tag, status } = req.query;
        const where = { status: status || 'OPEN' };
        if (tag) {
            where.tags = { has: tag };
        }
        const posts = yield prisma.projectPost.findMany({
            where,
            include: {
                applications: {
                    select: { id: true, applicantId: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: posts
        });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
}));
// Get a single post with full application details
app.get('/marketplace/posts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const post = yield prisma.projectPost.findUnique({
            where: { id },
            include: {
                applications: true
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({
            success: true,
            data: post
        });
    }
    catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
}));
// Apply to a project
app.post('/marketplace/posts/:id/apply', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { applicantId, message } = req.body;
        if (!applicantId || !message) {
            return res.status(400).json({ error: 'applicantId and message are required' });
        }
        // Check if post exists and is open
        const post = yield prisma.projectPost.findUnique({ where: { id } });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.status !== 'OPEN') {
            return res.status(400).json({ error: 'This post is no longer accepting applications' });
        }
        if (post.authorId === applicantId) {
            return res.status(400).json({ error: 'You cannot apply to your own post' });
        }
        const application = yield prisma.application.create({
            data: { postId: id, applicantId, message }
        });
        res.status(201).json({
            success: true,
            data: application
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'You have already applied to this post' });
        }
        console.error('Error applying to post:', error);
        res.status(500).json({ error: 'Failed to apply' });
    }
}));
// Update a post (close it, etc.)
app.patch('/marketplace/posts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { authorId, status, title, description, tags } = req.body;
        // Verify ownership
        const post = yield prisma.projectPost.findUnique({ where: { id } });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.authorId !== authorId) {
            return res.status(403).json({ error: 'Only the author can update this post' });
        }
        const updateData = {};
        if (status)
            updateData.status = status;
        if (title)
            updateData.title = title;
        if (description)
            updateData.description = description;
        if (tags)
            updateData.tags = tags;
        const updated = yield prisma.projectPost.update({
            where: { id },
            data: updateData
        });
        res.json({
            success: true,
            data: updated
        });
    }
    catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
}));
app.get('/health', (req, res) => {
    res.json({ status: 'Marketplace service is healthy' });
});
app.listen(port, () => {
    console.log(`Marketplace service listening at http://localhost:${port}`);
});
