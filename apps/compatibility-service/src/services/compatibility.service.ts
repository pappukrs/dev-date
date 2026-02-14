import { User, CompatibilityScore } from '@dev-date/common';

const EXPERIENCE_LEVELS: Record<string, number> = {
    'Junior': 1,
    'Mid': 2,
    'Senior': 3,
    'Lead': 4
};

export class CompatibilityService {
    static calculate(userA: User, userB: User): CompatibilityScore {
        const techScore = this.calculateTechStackOverlap(userA.techStack, userB.techStack);
        const expScore = this.calculateExperienceMatch(userA.experienceLevel, userB.experienceLevel);

        // Weighted average: 70% tech, 30% experience
        const totalScore = (techScore * 0.7) + (expScore * 0.3);

        return {
            score: Math.round(totalScore * 100) / 100, // Round to 2 decimals
            details: {
                techStackOverlap: techScore,
                experienceMatch: expScore
            }
        };
    }

    private static calculateTechStackOverlap(stackA: string[], stackB: string[]): number {
        if (!stackA.length || !stackB.length) return 0;

        const setA = new Set(stackA.map(s => s.toLowerCase()));
        const setB = new Set(stackB.map(s => s.toLowerCase()));

        let intersection = 0;
        for (const tech of setA) {
            if (setB.has(tech)) intersection++;
        }

        const union = new Set([...setA, ...setB]).size;
        return union === 0 ? 0 : intersection / union; // Jaccard Index
    }

    private static calculateExperienceMatch(levelA: string, levelB: string): number {
        const valA = EXPERIENCE_LEVELS[levelA] || 0;
        const valB = EXPERIENCE_LEVELS[levelB] || 0;

        if (valA === 0 || valB === 0) return 0;

        const diff = Math.abs(valA - valB);

        // 0 diff -> 1.0
        // 1 diff -> 0.8
        // 2 diff -> 0.5
        // 3 diff -> 0.2
        if (diff === 0) return 1.0;
        if (diff === 1) return 0.8;
        if (diff === 2) return 0.5;
        return 0.2;
    }
}
