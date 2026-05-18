'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

import { SpinnerCustom } from '@/components/ui/SpinnerCustom';
import { usePageState } from '@/store/page-state';

export function GlobalSpinnerProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isPageLoading = usePageState((state) => state.isPageLoading);

  const isLoading = status === 'loading' || isPageLoading;

  return (
    <>
      {isLoading && <SpinnerCustom />}
      {children}
    </>
  );
}
