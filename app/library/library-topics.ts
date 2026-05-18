import { TopicService } from '@/services/topic.service';
import { PaginatedResult } from '@/types/pagination';
import { TopicOverview } from '@/types/schemas/topic-schema';

export const LIBRARY_TOPICS_PAGE_SIZE = 3;

export async function getLibraryTopicsPage(
  page: number,
  skipIds: number[]
): Promise<{ data: PaginatedResult<TopicOverview, 'Topic'> | undefined; error?: string }> {
  return TopicService.loadTopicsPage(skipIds, {
    page,
    size: LIBRARY_TOPICS_PAGE_SIZE,
    orderBy: 'created_at',
    ascending: true,
  });
}
