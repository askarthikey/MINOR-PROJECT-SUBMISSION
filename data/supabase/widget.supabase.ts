import z from 'zod';

import { supabaseServer } from '@/lib/supabase/server';
import { Widget, WidgetSchema } from '@/types/schemas/widget-schema';

export async function getWidgets(topicId: string): Promise<Widget[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('topic_widgets')
    .select(
      `
    widget_type,
    widgets (
      name,
      description,
      icon
    )
  `
    )
    .eq('topic_id', topicId);

  if (error) {
    throw error;
  }

  if (data === null) {
    return [];
  }

  const parsed = z.array(WidgetSchema).safeParse(data);

  if (parsed.success) {
    return parsed.data;
  }

  return [];
}
