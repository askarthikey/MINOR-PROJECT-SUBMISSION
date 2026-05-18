import '@/app/globals.css';

import { Suspense } from 'react';
import { Toaster } from 'sonner';

import { SpinnerCustom } from '@/components/ui/SpinnerCustom';
import { Providers } from '@/providers/providers';

const DEFAULT_TOASTER_DURATION = 3500;

export const metadata = {
  title: 'Gamified Interview Trainer — AI-Powered Interview Practice',
  description:
    'Practice interviews with AI scoring, adaptive difficulty, and real-time feedback. Build your confidence and ace your next technical interview.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <Providers>
          <Suspense fallback={<SpinnerCustom />}>
            {children}
          </Suspense>
          <Toaster
            position="bottom-center"
            richColors
            expand={true}
            duration={DEFAULT_TOASTER_DURATION}
            toastOptions={{ className: 'z-25' }}
          />
        </Providers>
      </body>
    </html>
  );
}
