import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        username: { label: 'Username', type: 'text' },
        mode: { label: 'Mode', type: 'text' }, // 'login' | 'register'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const backendUrl = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8080';
        const isRegister = credentials.mode === 'register';
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

        try {
          const body: Record<string, string> = {
            email: credentials.email,
            password: credentials.password,
          };
          if (isRegister && credentials.username) {
            body.name = credentials.username;
          }

          const res = await fetch(`${backendUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Authentication failed');
          }

          const data = await res.json();

          return {
            id: data.user_id,
            email: data.email,
            name: data.name || credentials.username || '',
            image: '',
            accessToken: data.token,
            onboardingComplete: data.onboarding_complete ?? false,
          };
        } catch (error: any) {
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.userId = user.id;
        token.username = user.name ?? undefined;
        token.onboardingComplete = (user as any).onboardingComplete;
      }
      // Handle session update() calls from the frontend
      if (trigger === 'update' && updateData) {
        if (typeof (updateData as any).onboardingComplete === 'boolean') {
          token.onboardingComplete = (updateData as any).onboardingComplete;
        }
        if (typeof (updateData as any).name === 'string') {
          token.username = (updateData as any).name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        userId: token.userId as string,
        onboardingComplete: token.onboardingComplete as boolean,
        user: {
          ...session.user,
          id: token.userId as string,
          name: token.username as string,
        },
      };
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
