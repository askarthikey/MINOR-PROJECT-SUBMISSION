import { z } from 'zod';

import { supabaseBrowser } from '@/lib/supabase/client';
import { LocaleStringSchema } from '@/types/schemas/locale-schemas';
import { GeneralQuestion, QuestionAdminListItemSchema } from '@/types/schemas/question-schemas';
import { WidgetType } from '@/types/widget';

export async function getAllQuestions(): Promise<{
  data: QuestionAdminListItem[] | undefined;
  error?: string;
}> {
  try {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.from('question_admin_list').select('*');

    if (error != undefined) {
      throw error;
    }

    if (data != undefined) {
      const array = z.array(QuestionAdminListItemSchema).safeParse(data);

      if (array.success) {
        return { data: array.data };
      } else {
        throw new Error('Failed to correctly parse data from server');
      }
    }

    throw new Error('Something went wrong');
  } catch (error: unknown) {
    return { data: undefined, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function upsertQuestion(
  question: GeneralQuestion
): Promise<{ data: QuestionAdminListItem | undefined; error?: string }> {
  try {
    const supabase = supabaseBrowser();

    if (question.id === 0) {
      const { data: exists } = await supabase
        .from('topic_widgets')
        .select('topic_id')
        .match({ topic_id: question.topicId, widget_type: question.widgetType })
        .maybeSingle();

      if (!exists) {
        await supabase.from('topic_widgets').insert({
          topic_id: question.topicId,
          widget_type: question.widgetType,
        });
      }
    }

    const payload = mapQuestionToSupabaseForm(question);
    const { data, error } = await supabase
      .from('questions')
      .upsert(payload)
      .select(
        `
    id,
    widget_type,
    created_at,
    payload_question,
    payload_answer,
    topic_widgets (
      topics (
        id,
        name
      )
    )
  `
      )
      .single();

    if (error) {
      throw error;
    }

    if (data != undefined) {
      const parsed = QuestionSchema.safeParse(data);

      if (parsed.success) {
        return { data: parsed.data };
      }

      throw new Error('Failed to correctly parse data from server');
    }

    throw new Error('Something went wrong');
  } catch (error: unknown) {
    return { data: undefined, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function deleteQuestions(ids: number[]): Promise<{ error?: string }> {
  try {
    const supabase = supabaseBrowser();

    const { error } = await supabase.from('questions').delete().in('id', ids);

    if (error) throw error;

    return { error: undefined };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Bulk delete failed' };
  }
}

const mapQuestionToSupabaseForm = (data: GeneralQuestion) => {
  const base = {
    topic_id: data.topicId,
    widget_type: data.widgetType,
    payload_question: data.payloadQuestion,
    payload_answer: data.payloadAnswer,
  };

  if (data.id !== 0) {
    return { ...base, id: data.id };
  }

  return base;
};

export const QuestionSchema = z
  .object({
    id: z.number(),
    widget_type: z.enum(WidgetType),
    created_at: z.coerce.date(),
    payload_question: z.unknown(),
    payload_answer: z.unknown().nullable(),

    topic_widgets: z
      .object({
        topics: z.object({
          id: z.number(),
          name: LocaleStringSchema,
        }),
      })
      .nullable(),
  })
  .transform((data) => ({
    id: data.id,
    widgetType: data.widget_type,
    createdAt: data.created_at,
    payloadQuestion: data.payload_question,
    payloadAnswer: data.payload_answer,
    topicId: data.topic_widgets?.topics.id ?? 0,
    topicName: data.topic_widgets?.topics.name ?? { en: 'en', ru: 'ru', by: 'by' },
  }));
export type QuestionAdminListItem = z.infer<typeof QuestionAdminListItemSchema>;
