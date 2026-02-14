export class ScoringService {
    static calculateScore(githubData: any): number {
        let score = 0;
        const { profile, repos } = githubData;

        // 1. Activity Score (max 20)
        const publicRepos = profile.public_repos || 0;
        score += Math.min(publicRepos * 0.5, 20);

        // 2. Popularity Score (max 30)
        const followers = profile.followers || 0;
        score += Math.min(followers * 0.2, 30);

        // 3. Impact Score (Stars) (max 30)
        const totalStars = repos.reduce((acc: number, repo: any) => acc + (repo.stargazers_count || 0), 0);
        score += Math.min(totalStars * 0.5, 30);

        // 4. Consistency/Account Age (max 20)
        const createdAt = new Date(profile.created_at);
        const yearsActive = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
        score += Math.min(yearsActive * 4, 20);

        return Math.round(score);
    }

    static determineExperienceLevel(score: number): 'Junior' | 'Mid' | 'Senior' | 'Lead' {
        if (score < 30) return 'Junior';
        if (score < 60) return 'Mid';
        if (score < 85) return 'Senior';
        return 'Lead';
    }
}
