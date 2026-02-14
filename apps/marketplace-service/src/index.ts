import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '.prisma/marketplace-client';
import { ServicePorts } from '@dev-date/common';

dotenv.config();

const app = express();
const port = process.env.PORT || ServicePorts.MARKETPLACE;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Create a project post
app.post('/marketplace/posts', async (req, res) => {
    try {
        const { authorId, title, description, tags } = req.body;

        if (!authorId || !title || !description) {
            return res.status(400).json({ error: 'authorId, title, and description are required' });
        }

        const post = await prisma.projectPost.create({
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
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// List all open posts (with optional tag filter)
app.get('/marketplace/posts', async (req, res) => {
    try {
        const { tag, status } = req.query;
        const where: any = { status: (status as string) || 'OPEN' };

        if (tag) {
            where.tags = { has: tag as string };
        }

        const posts = await prisma.projectPost.findMany({
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
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get a single post with full application details
app.get('/marketplace/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const post = await prisma.projectPost.findUnique({
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
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Apply to a project
app.post('/marketplace/posts/:id/apply', async (req, res) => {
    try {
        const { id } = req.params;
        const { applicantId, message } = req.body;

        if (!applicantId || !message) {
            return res.status(400).json({ error: 'applicantId and message are required' });
        }

        // Check if post exists and is open
        const post = await prisma.projectPost.findUnique({ where: { id } });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.status !== 'OPEN') {
            return res.status(400).json({ error: 'This post is no longer accepting applications' });
        }
        if (post.authorId === applicantId) {
            return res.status(400).json({ error: 'You cannot apply to your own post' });
        }

        const application = await prisma.application.create({
            data: { postId: id, applicantId, message }
        });

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'You have already applied to this post' });
        }
        console.error('Error applying to post:', error);
        res.status(500).json({ error: 'Failed to apply' });
    }
});

// Update a post (close it, etc.)
app.patch('/marketplace/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, status, title, description, tags } = req.body;

        // Verify ownership
        const post = await prisma.projectPost.findUnique({ where: { id } });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.authorId !== authorId) {
            return res.status(403).json({ error: 'Only the author can update this post' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (tags) updateData.tags = tags;

        const updated = await prisma.projectPost.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Marketplace service is healthy' });
});

app.listen(port, () => {
    console.log(`Marketplace service listening at http://localhost:${port}`);
});
