import { LIBRARY_TOPICS_PAGE_SIZE } from '@/app/library/library-topics';
import { getRecentTopics, getTopicById, getTopicsPage } from '@/data/topic.api';
import { getQueryClient } from '@/lib/query-storage';
import { PageInfo, PaginatedResult } from '@/types/pagination';
import { TopicOverview } from '@/types/schemas/topic-schema';

const RECENT_TOPICS = 'recent_topics';
const TOPIC_PAGES = 'topic_pages';

export const TopicService = {
  loadRecentTopics: (): Promise<{ data: TopicOverview[] | undefined; error?: string }> => {
    return getQueryClient().fetchQuery({
      queryKey: [RECENT_TOPICS],
      queryFn: () => getRecentTopics(),
    });
  },

  loadTopicsPage: (
    skipIds: number[] = [],
    pageInfo?: PageInfo<'Topic'>
  ): Promise<{ data: PaginatedResult<TopicOverview, 'Topic'> | undefined; error?: string }> => {
    const queryParameters = pageInfo ?? {
      page: 1,
      size: LIBRARY_TOPICS_PAGE_SIZE,
      orderBy: 'created_at',
      ascending: true,
    };

    return getQueryClient().fetchQuery({
      queryKey: [TOPIC_PAGES, queryParameters, skipIds],
      queryFn: () => getTopicsPage(queryParameters, skipIds),
    });
  },

  getTopicById: async (topicId: number): Promise<TopicOverview | undefined> => {
    const cacheResult = getTopicFromCache(topicId);

    if (cacheResult) {
      return cacheResult;
    }

    const { data } = await getTopicById(topicId);

    return data;
  },
};

const getTopicFromCache = (topicId: number): TopicOverview | undefined => {
  const recentTopics = getQueryClient().getQueryData<TopicOverview[]>([RECENT_TOPICS]);
  const recentFind = recentTopics?.find((t) => t.id === topicId);
  if (recentFind) return recentFind;

  const allPagesData = getQueryClient().getQueriesData<PaginatedResult<TopicOverview, 'Topic'>>({
    queryKey: [TOPIC_PAGES],
  });

  for (const [, page] of allPagesData) {
    const foundInPage = page?.items.find((t) => t.id === topicId);
    if (foundInPage) return foundInPage;
  }
};

export const getQueryParameters = (pageInfo: PageInfo<'Topic'>) => {
  return Object.entries(pageInfo)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};
