import { mockWidgets } from '@/data/mocks/widget.mock';
import { getWidgets } from '@/data/supabase/widget.supabase';
import { Widget } from '@/types/schemas/widget-schema';

export async function getWidgetsByTopic(topicId: string): Promise<Widget[]> {
  if (process.env.MOCK_MODE === 'true') {
    return mockWidgets;
  }

  return getWidgets(topicId);
}
