export type UserRole = "owner" | "influencer";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  credits: number;
  onboardingComplete: boolean;
  integrations: {
    meta?: {
      accessToken: string;
      adAccountId: string;
      expiresAt: Date;
    };
    google?: {
      refreshToken: string;
      customerId: string;
    };
  };
}
