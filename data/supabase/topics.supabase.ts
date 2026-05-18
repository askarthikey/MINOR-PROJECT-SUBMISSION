import { supabaseServer } from '@/lib/supabase/server';
import { LanguageCode } from '@/services/locale/locale.service';

export async function getTopicName(topicId: string): Promise<Record<LanguageCode, string> | undefined> {
  const supabase = await supabaseServer();

  const query = supabase
    .from('topics')
    .select(
      `
    name
  `
    )
    .eq('id', topicId);

  const { data, error } = await query.single();
  if (error) {
    throw error;
  }

  if (data === null) {
    return undefined;
  }

  return data.name;
}
