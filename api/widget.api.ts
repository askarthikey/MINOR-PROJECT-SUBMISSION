import { mockWidgets } from '@/data/mocks/widget.mock';
import { Widget } from '@/types/schemas/widget-schema';

export async function getWidgetsByTopic(topicId: string): Promise<Widget[]> {
  console.log(topicId); //TODO: must be deleted. added to pass the linter check
  return mockWidgets;
}
