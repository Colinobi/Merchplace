export interface UserProfile {
    walletAddress: string;
    username?: string;
    avatarUrl?: string; // URL to Firebase Storage or external
    reputation: number;
    createdAt: number; // Timestamp
    bio?: string;
}
