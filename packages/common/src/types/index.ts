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
