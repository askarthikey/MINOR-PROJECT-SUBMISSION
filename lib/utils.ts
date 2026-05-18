import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Routes } from './routes';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNavigation(path: string): Routes | undefined {
  const navigation = path.split('/')[1] || '';

  return Object.values(Routes).find((route) => `/${navigation}` === route);
}
