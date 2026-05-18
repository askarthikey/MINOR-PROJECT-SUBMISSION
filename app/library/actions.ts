'use server';

import { getLibraryTopicsPage } from '@/app/library/library-topics';
import { TopicOverview } from '@/types/schemas/topic-schema';

type TopicsPageResult =
  | {
      items: TopicOverview[];
      page: number;
      totalPages: number;
    }
  | {
      error: string;
    };

export async function getLibraryTopicsPageAction(page: number, skipIds: number[]): Promise<TopicsPageResult> {
  const normalizedPage = Number.isNaN(page) || page < 1 ? 1 : page;
  const { data, error } = await getLibraryTopicsPage(normalizedPage, skipIds);

  if (error != undefined || data == undefined) {
    return {
      error: error ?? 'Failed to load topics',
    };
  }

  return {
    items: data.items,
    page: data.page,
    totalPages: data.totalPages,
  };
}
