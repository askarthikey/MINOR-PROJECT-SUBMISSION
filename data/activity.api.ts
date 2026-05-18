import { format, startOfMonth, subMonths } from 'date-fns';
import z from 'zod';

import type { ActivityDay } from '@/components/dashboard/activity/activity.types';
import { supabaseServer } from '@/lib/supabase/server';

const activityViewRowSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().nonnegative(),
});

export async function getDailyActivity(limit = 120): Promise<{ data: ActivityDay[] | undefined; error?: string }> {
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

    const today = new Date();
    const startDay = format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd');
    const endDay = format(today, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('profile_questions_daily_activity')
      .select('day, count')
      .eq('user_id', user.id)
      .gte('day', startDay)
      .lte('day', endDay)
      .order('day', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (data == undefined || data.length === 0) {
      return { data: [] };
    }

    const rows = z.array(activityViewRowSchema).safeParse(data);

    if (!rows.success) {
      throw new Error('Invalid profile_questions_daily_activity format');
    }

    const days: ActivityDay[] = rows.data.map((row) => ({
      date: row.day,
      count: row.count,
    }));
    return { data: days };
  } catch (error: unknown) {
    return {
      data: undefined,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
