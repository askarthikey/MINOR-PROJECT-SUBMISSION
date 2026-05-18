'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Routes } from '@/lib/routes';
import { getNavigation } from '@/lib/utils';
import { useAuth } from '@/providers/auth-state.provider';
import { signIn, signUp } from '@/services/authorization/auth.server';
import { SignInSchema, SignUpSchema } from '@/types/schemas/authorization-schemas';
import { SchemaData } from '@/types/schemas/schema-registry';

import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

export default function AuthContent() {
  const [signInMode, toggleMode] = useState(true);
  const { setUser, setAuthorizing } = useAuth();
  const { t, tor } = useTranslation();

  const router = useRouter();
  const searchParameters = useSearchParams();

  const redirect = () => {
    const redirectParameter = searchParameters.get('redirect');

    const validRoute = getNavigation(redirectParameter ?? '');

    router.replace(validRoute != undefined && redirectParameter != undefined ? redirectParameter : Routes.Dashboard);
  };

  const handleSignIn = async (signInData: SchemaData) => {
    const parsed = SignInSchema.safeParse(signInData);
    if (parsed.success) {
      setAuthorizing(true);

      const { data, error } = await signIn(parsed.data).finally(() => setAuthorizing(false));

      if (error != undefined) {
        toast.error(tor(error, 'error.global.unknown'));
      }
      if (data) {
        setUser(data);
        toast.success(t('auth.signin.success'));
        redirect();
      }
    } else {
      toast.error(t('error.auth.signin.invalid'));
    }
  };

  const handleSignUp = async (signUpData: SchemaData) => {
    const parsed = SignUpSchema.safeParse(signUpData);
    if (parsed.success) {
      setAuthorizing(true);

      const { data, error } = await signUp(parsed.data).finally(() => setAuthorizing(false));

      if (error != undefined) {
        toast.error(tor(error, 'error.global.unknown'));
      }
      if (data) {
        setUser(data);
        toast.success(t('auth.signup.success'));
        redirect();
      }
    }
  };

  return (
    <div className="mx-auto mt-5 max-w-lg p-8">
      {signInMode ? <SignInForm handleSubmit={handleSignIn} /> : <SignUpForm handleSubmit={handleSignUp} />}
      <Button variant={'secondary'} type="button" className="w-full" onClick={() => toggleMode(!signInMode)}>
        {t(signInMode ? 'auth.signup.title' : 'auth.signin.title')}
      </Button>
    </div>
  );
}
