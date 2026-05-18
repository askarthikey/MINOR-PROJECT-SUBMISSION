'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { UserDetails, UserDetailsSchema } from '@/types/schemas/authorization-schemas';

type AuthContextType = {
  user: UserDetails | undefined;
  setUser: (user: UserDetails | undefined) => void;
  isAuthorized: boolean;
  isAuthorizing: boolean;
  setAuthorizing: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthStateProviderProperties = {
  children: ReactNode;
  userDetails: string | undefined;
};

export function AuthStateProvider({ children, userDetails }: AuthStateProviderProperties) {
  let userObject;
  if (userDetails != undefined) {
    try {
      const jsonObject = JSON.parse(userDetails);

      if (jsonObject != undefined) {
        const parsed = UserDetailsSchema.safeParse(jsonObject);

        if (parsed.success) userObject = parsed.data;
      }
    } catch {}
  }

  const [user, setUser] = useState<UserDetails | undefined>(userObject);

  const [isAuthorizing, setAuthorizing] = useState<boolean>(false);
  const isAuthorized = !!user;

  const authContext: AuthContextType = {
    user,
    setUser,
    isAuthorized,
    isAuthorizing,
    setAuthorizing,
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth was not defined at time');
  }

  return context;
}
