import z from 'zod';

import { supabaseBrowser } from '@/lib/supabase/client';
import {
  mapWidgetBaseFields,
  Widget,
  WidgetAdminListItem,
  WidgetAdminListItemSchema,
  WidgetBaseSchema,
} from '@/types/schemas/widget-schema';

export async function getAllWidgets(): Promise<{ data: WidgetAdminListItem[] | undefined; error?: string }> {
  try {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.from('widget_admin_list').select('*');

    if (error != undefined) {
      throw error;
    }

    if (data != undefined) {
      const array = z.array(WidgetAdminListItemSchema).safeParse(data);

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

export async function updateWidget(widget: Widget): Promise<{ data: WidgetAdminListItem | undefined; error?: string }> {
  try {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.from('widgets').update(widget).eq('type', widget.type).select().single();

    if (error) {
      throw error;
    }

    if (data != undefined) {
      const parsed = WidgetBaseSchema.safeParse(data);

      if (parsed.success) {
        return { data: { ...mapWidgetBaseFields(parsed.data), sumQuestions: 0 } };
      }

      throw new Error('Failed to correctly parse data from server');
    }

    throw new Error('Something went wrong');
  } catch (error: unknown) {
    return { data: undefined, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}
