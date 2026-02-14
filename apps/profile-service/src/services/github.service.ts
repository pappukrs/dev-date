import axios from 'axios';

export class GitHubService {
    private static readonly BASE_URL = 'https://api.github.com';

    static async getUserData(username: string, token?: string) {
        const headers = token ? { Authorization: `token ${token}` } : {};

        try {
            const [user, repos] = await Promise.all([
                axios.get(`${this.BASE_URL}/users/${username}`, { headers }),
                axios.get(`${this.BASE_URL}/users/${username}/repos?per_page=100&sort=updated`, { headers })
            ]);

            return {
                profile: user.data,
                repos: repos.data
            };
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
            throw new Error('Failed to fetch GitHub data');
        }
    }

    static calculateLanguages(repos: any[]) {
        const languages: Record<string, number> = {};
        repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });
        return Object.entries(languages)
            .sort(([, a], [, b]) => b - a)
            .map(([lang]) => lang)
            .slice(0, 5); // Top 5
    }
}
