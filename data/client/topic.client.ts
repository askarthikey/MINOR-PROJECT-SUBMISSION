import z from 'zod';

import { supabaseBrowser } from '@/lib/supabase/client';
import {
  mapTopicBaseFields,
  Topic,
  TopicAdminListItem,
  TopicAdminListItemSchema,
  TopicBaseSchema,
} from '@/types/schemas/topic-schema';

export async function getAllTopics(): Promise<{ data: TopicAdminListItem[] | undefined; error?: string }> {
  try {
    const supabase = await supabaseBrowser();

    const { data, error } = await supabase.from('topic_admin_list').select('*').order('id', { ascending: true });

    if (error != undefined) {
      throw error;
    }

    if (data != undefined) {
      const array = z.array(TopicAdminListItemSchema).safeParse(data);

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

export async function getTopicIdNamePairs(): Promise<{
  data: { id: number; name: string }[] | undefined;
  error?: string;
}> {
  try {
    const supabase = await supabaseBrowser();

    const { data, error } = await supabase.from('topics').select('id, name');

    if (error != undefined) {
      throw error;
    }

    if (data != undefined) {
      const array = z
        .array(
          TopicBaseSchema.pick({ id: true, name: true }).transform((t) => ({
            id: t.id,
            name: t.name.en, // Flattens the JSONB to just the English string
          }))
        )
        .safeParse(data);

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

export async function upsertTopic(topic: Topic): Promise<{ data: TopicAdminListItem | undefined; error?: string }> {
  try {
    const supabase = await supabaseBrowser();

    const payload = topic.id === 0 ? { ...topic, id: undefined } : topic;
    const { data, error } = await supabase.from('topics').upsert(payload).select().single();

    if (error) {
      throw error;
    }

    if (data != undefined) {
      const parsed = TopicBaseSchema.safeParse(data);

      if (parsed.success) {
        return { data: { ...mapTopicBaseFields(parsed.data), sumQuestions: 0 } };
      }

      throw new Error('Failed to correctly parse data from server');
    }

    throw new Error('Something went wrong');
  } catch (error: unknown) {
    return { data: undefined, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function deleteTopics(ids: number[]): Promise<{ error?: string }> {
  try {
    const supabase = await supabaseBrowser();

    const { error } = await supabase.from('topics').delete().in('id', ids);

    if (error) throw error;

    return { error: undefined };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Bulk delete failed' };
  }
}
