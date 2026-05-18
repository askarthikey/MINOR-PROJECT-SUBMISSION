'use server';

import { mockDashboardStats, mockInProgressTopics } from '@/data/mocks/dashboard.mock';
import {
  getDashboardStats as supaGetDashboardStats,
  getInProgressTopics as supaGetInProgressTopics,
} from '@/data/supabase/dashboard.supabase';
import { LocaleString } from '@/types/schemas/locale-schemas';

export type InProgressTopic = {
  id: number;
  title: LocaleString;
  completed: number;
  total: number;
  lastPracticedAt: Date;
  href: string;
};

export type DashboardStats = {
  days: {
    date: string;
    count: number;
  }[];
  todayAnswers: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  totalDays: number;
  streak: number;
  bestStreak: number;
};

export async function getDashboardStats(): Promise<{ data: DashboardStats | undefined; error?: string }> {
  if (process.env.MOCK_MODE === 'true') {
    return { data: mockDashboardStats };
  }

  return supaGetDashboardStats();
}

export async function getInProgressTopics(limit = 3): Promise<{ data: InProgressTopic[] | undefined; error?: string }> {
  if (process.env.MOCK_MODE === 'true') {
    return { data: mockInProgressTopics.slice(0, limit) };
  }

  return supaGetInProgressTopics(limit);
}
