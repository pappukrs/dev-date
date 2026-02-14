import { query } from '../db';
import { User } from '@dev-date/common';

export class UserModel {
    static async createTable() {
        const text = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        github_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        avatar_url VARCHAR(255),
        bio TEXT,
        tech_stack TEXT[],
        dev_score INTEGER DEFAULT 0,
        experience_level VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await query(text);
    }

    static async findByGithubId(githubId: string): Promise<User | null> {
        const text = 'SELECT * FROM users WHERE github_id = $1';
        const result = await query(text, [githubId]);
        if (result.rows.length) {
            return this.mapRowToUser(result.rows[0]);
        }
        return null;
    }

    static async create(user: Partial<User>): Promise<User> {
        const text = `
      INSERT INTO users (github_id, username, display_name, avatar_url, bio, tech_stack, dev_score, experience_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const values = [
            user.githubId,
            user.username,
            user.displayName,
            user.avatarUrl,
            user.bio,
            user.techStack || [],
            user.devScore || 0,
            user.experienceLevel || 'Junior'
        ];
        const result = await query(text, values);
        return this.mapRowToUser(result.rows[0]);
    }

    private static mapRowToUser(row: any): User {
        return {
            id: row.id,
            githubId: row.github_id,
            username: row.username,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            bio: row.bio,
            techStack: row.tech_stack,
            devScore: row.dev_score,
            experienceLevel: row.experience_level
        };
    }
}
