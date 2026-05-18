import Link from 'next/link';

import AnimatedCounter from '@/components/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Routes } from '@/lib/routes';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full flex-col items-center justify-center px-6 text-center">
      <div className="border-secondary rounded-lg border-2 p-10">
        <div className="m-10">
          <h1 className="text-5xl font-bold sm:text-6xl">
            <AnimatedCounter startValue={100} endValue={404} animationDuration={2} />
          </h1>
          <p className="text-2xl">Not Found</p>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-3xl">
            The page you are looking for does not exist.
          </p>
        </div>
        <Button variant="outline" size="lg" asChild>
          <Link href={Routes.Home}>Go to Main page</Link>
        </Button>
      </div>
    </div>
  );
}
