'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { GlobalSpinnerProvider } from './global-spinner.provider';

type ProvidersProperties = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProperties) {
  return (
    <SessionProvider>
      <TooltipProvider>
        <GlobalSpinnerProvider>{children}</GlobalSpinnerProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
