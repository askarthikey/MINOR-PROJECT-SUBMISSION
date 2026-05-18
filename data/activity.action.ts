'use server';

import { supabaseServer } from '@/lib/supabase/server';

type TrackQuestionAttemptProperties = {
  questionId: number;
  isSuccess: boolean | undefined;
};

export async function trackQuestionAttempt({ questionId, isSuccess }: TrackQuestionAttemptProperties): Promise<void> {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: You must be logged in to track progress.');
  }

  const { error } = await supabase.from('profile_questions').upsert(
    {
      question_id: questionId,
      user_id: user.id,
      is_success: isSuccess ?? false,
    },
    {
      onConflict: 'user_id,question_id',
    }
  );
  if (error != undefined) {
    throw new Error(error.message);
  }
}
