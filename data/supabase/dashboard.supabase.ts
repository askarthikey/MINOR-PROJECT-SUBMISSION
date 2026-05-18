'use server';

import { differenceInCalendarDays, format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns';
import { z } from 'zod';

import { ActivityDay } from '@/components/dashboard/activity/activity.types';
import type { DashboardStats, InProgressTopic } from '@/data/dashboard.api';
import { Routes } from '@/lib/routes';
import { supabaseServer } from '@/lib/supabase/server';
import { TopicOverviewSchema } from '@/types/schemas/topic-schema';

const activityViewRowSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().nonnegative(),
});

export async function getDashboardStats(): Promise<{ data: DashboardStats | undefined; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (user == undefined) {
      return {
        data: {
          days: [],
          todayAnswers: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          accuracy: 0,
          totalDays: 0,
          streak: 0,
          bestStreak: 0,
        },
      };
    }

    const today = new Date();
    const startDay = format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd');
    const endDay = format(today, 'yyyy-MM-dd');

    const [
      { data: activityData, error: activityError },
      { data: streakData, error: streakError },
      { count: totalAnswers, error: totalAnswersError },
      { count: correctAnswers, error: correctAnswersError },
    ] = await Promise.all([
      supabase
        .from('profile_questions_daily_activity')
        .select('day, count')
        .eq('user_id', user.id)
        .gte('day', startDay)
        .lte('day', endDay)
        .order('day', { ascending: true }),
      supabase
        .from('profile_questions_daily_activity')
        .select('day, count')
        .eq('user_id', user.id)
        .order('day', { ascending: true }),
      supabase.from('profile_questions').select('question_id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('profile_questions')
        .select('question_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_success', true),
    ]);

    if (activityError) throw activityError;
    if (streakError) throw streakError;
    if (totalAnswersError) throw totalAnswersError;
    if (correctAnswersError) throw correctAnswersError;

    const parsedActivity = z.array(activityViewRowSchema).safeParse(activityData ?? []);
    const parsedStreak = z.array(activityViewRowSchema).safeParse(streakData ?? []);

    if (!parsedActivity.success || !parsedStreak.success) {
      throw new Error('Invalid profile_questions_daily_activity format');
    }

    const days: ActivityDay[] = parsedActivity.data.map((row) => ({
      date: row.day,
      count: row.count,
    }));
    const todayKey = format(today, 'yyyy-MM-dd');
    const todayAnswers = days.find((day) => day.date === todayKey)?.count ?? 0;
    const resolvedTotalAnswers = totalAnswers ?? 0;
    const resolvedCorrectAnswers = correctAnswers ?? 0;
    const totalDays = parsedStreak.data.length;
    const { streak, bestStreak } = calculateStreaks(
      parsedStreak.data.map((row) => row.day),
      today
    );

    return {
      data: {
        days,
        todayAnswers,
        correctAnswers: resolvedCorrectAnswers,
        totalAnswers: resolvedTotalAnswers,
        accuracy: resolvedTotalAnswers === 0 ? 0 : Math.round((resolvedCorrectAnswers / resolvedTotalAnswers) * 100),
        totalDays,
        streak,
        bestStreak,
      },
    };
  } catch (error: unknown) {
    return {
      data: undefined,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function getInProgressTopics(limit = 3): Promise<{ data: InProgressTopic[] | undefined; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (user == undefined) {
      return { data: [] };
    }

    const { data, error } = await supabase
      .from('topic_widget_summary')
      .select('*')
      .filter('last_accessed_at', 'not.is', 'null')
      .order('last_accessed_at', { ascending: false })
      .limit(Math.max(limit * 10, limit));

    if (error) throw error;
    if (data == undefined || data.length === 0) return { data: [] };

    const parsed = z.array(TopicOverviewSchema).safeParse(data);

    if (!parsed.success) {
      throw new Error('Invalid topic_widget_summary format');
    }

    const topics = parsed.data
      .flatMap((topic) => {
        if (topic.lastTrainedAt == undefined) {
          return [];
        }

        const completed = topic.widgets.reduce((sum, widget) => sum + widget.correctAnswers, 0);
        const total = topic.widgets.reduce((sum, widget) => sum + widget.totalQuestions, 0);

        if (total === 0 || completed >= total) {
          return [];
        }

        return [
          {
            id: topic.id,
            title: topic.name,
            completed,
            total,
            lastPracticedAt: topic.lastTrainedAt,
            href: `${Routes.Library}/${topic.id}`,
          },
        ];
      })
      .slice(0, limit);

    return { data: topics };
  } catch (error: unknown) {
    return {
      data: undefined,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

function calculateStreaks(activityDays: string[], today: Date) {
  if (activityDays.length === 0) {
    return { streak: 0, bestStreak: 0 };
  }

  const dates = activityDays.map((day) => parseISO(day));
  let bestStreak = 0;
  let currentRun = 0;

  for (const [index, date] of dates.entries()) {
    if (index > 0 && differenceInCalendarDays(date, dates[index - 1]) === 1) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }

    bestStreak = Math.max(bestStreak, currentRun);
  }

  const lastActivity = dates.at(-1);

  if (lastActivity == undefined) {
    return { streak: 0, bestStreak };
  }

  const minimumActiveDay = subDays(today, 1);

  if (differenceInCalendarDays(lastActivity, minimumActiveDay) < 0) {
    return { streak: 0, bestStreak };
  }

  let streak = 1;

  for (let index = dates.length - 1; index > 0; index -= 1) {
    if (differenceInCalendarDays(dates[index], dates[index - 1]) !== 1) {
      break;
    }

    streak += 1;
  }

  return { streak, bestStreak };
}
