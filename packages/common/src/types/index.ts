export interface User {
    id: string;
    githubId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
    techStack: string[];
    devScore: number;
    experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead';
}

export interface AuthResponse {
    user: User;
    token: string;
}

export type SwipeAction = 'LIKE' | 'PASS';

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface CompatibilityScore {
    score: number;
    details: {
        techStackOverlap: number;
        experienceMatch: number;
        codingStyleMatch?: number;
    };
}

// Phase 3: Reputation types
export type ReputationLevel = 'Junior' | 'Senior' | 'Architect' | 'Legend';

export type ReputationAction =
    | 'HELPING'
    | 'BUG_FIX'
    | 'CONTRIBUTION'
    | 'MENTORING'
    | 'CHALLENGE_COMPLETED'
    | 'PROJECT_CREATED'
    | 'COLLABORATION';

export interface ReputationEvent {
    id: string;
    userId: string;
    action: ReputationAction;
    points: number;
    reason: string;
    createdAt: Date;
}

export interface UserReputation {
    id: string;
    userId: string;
    totalPoints: number;
    level: ReputationLevel;
    badges: string[];
    updatedAt: Date;
}

// Phase 3: Marketplace types
export type ProjectStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ProjectPost {
    id: string;
    authorId: string;
    title: string;
    description: string;
    tags: string[];
    status: ProjectStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectApplication {
    id: string;
    postId: string;
    applicantId: string;
    message: string;
    status: ApplicationStatus;
    createdAt: Date;
}
