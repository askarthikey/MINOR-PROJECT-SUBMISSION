import { PaginatedResult } from './pagination';
import { TopicOverview } from './schemas/topic-schema';

export type LibraryTopicsResponse = {
  recentTopics: TopicOverview[] | undefined;
  recentTopicsError?: string;
  topicsPage: PaginatedResult<TopicOverview, 'Topic'> | undefined;
  topicsPageError?: string;
};
export type TopicsResponse = TopicOverview[];
