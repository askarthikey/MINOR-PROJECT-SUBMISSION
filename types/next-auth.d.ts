import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    userId: string;
    onboardingComplete: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }

  interface User {
    accessToken?: string;
    onboardingComplete?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    userId?: string;
    username?: string;
    onboardingComplete?: boolean;
  }
}
