'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { WidgetType } from '@/types/widget';

export type ValidationQuestion = {
  widgetType: WidgetType;
  payloadQuestion: unknown;
  payloadAnswer: unknown;
};

export async function getValidationQuestion(questionId: number): Promise<ValidationQuestion> {
  const supabase = await supabaseServer();
  const query = supabase
    .from('questions')
    .select(
      `
      widget_type,
      payload_question,
    payload_answer
  `
    )
    .eq('id', questionId)
    .single();

  const { data, error } = await query.overrideTypes<{
    widget_type: WidgetType;
    payload_question: unknown;
    payload_answer: unknown;
  }>();

  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error('Data is missing');
  }

  return {
    widgetType: data.widget_type,
    payloadQuestion: data.payload_question,
    payloadAnswer: data.payload_answer,
  };
}
