import { subDays } from 'date-fns';

import { ActivityDay } from '@/components/dashboard/activity/activity.types';
import type { DashboardStats, InProgressTopic } from '@/data/dashboard.api';
import { LanguageCode } from '@/services/locale/locale.service';

const today = new Date();

export const mockDashboardStats: DashboardStats = {
  days: [
    { date: subDays(today, 2).toISOString().slice(0, 10), count: 4 },
    { date: subDays(today, 1).toISOString().slice(0, 10), count: 3 },
    { date: today.toISOString().slice(0, 10), count: 5 },
  ] satisfies ActivityDay[],
  todayAnswers: 5,
  correctAnswers: 6,
  totalAnswers: 10,
  accuracy: 50,
  totalDays: 12,
  streak: 3,
  bestStreak: 7,
};

export const mockInProgressTopics: InProgressTopic[] = [
  {
    id: 1,
    title: {
      [LanguageCode.en]: 'Prepositions',
      [LanguageCode.ru]: 'Предлоги',
      [LanguageCode.by]: 'Прыназоўнікі',
    },
    completed: 6,
    total: 20,
    lastPracticedAt: subDays(today, 2),
    href: '/library/1',
  },
  {
    id: 2,
    title: {
      [LanguageCode.en]: 'Conditionals',
      [LanguageCode.ru]: 'Условия',
      [LanguageCode.by]: 'Умовы',
    },
    completed: 2,
    total: 15,
    lastPracticedAt: subDays(today, 5),
    href: '/library/2',
  },
];
