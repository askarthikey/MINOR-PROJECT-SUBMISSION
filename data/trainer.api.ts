import { getLibraryTopicsPage } from '@/app/library/library-topics';
import { mockQuestions } from '@/data/mocks/questions.mock';
import { mockLibraryTopics } from '@/data/mocks/topics.mock';
import { QuestionService } from '@/services/question.service';
import { TopicService } from '@/services/topic.service';
import { QuestionInfo } from '@/types/schemas/question-schemas';
import { TopicOverview } from '@/types/schemas/topic-schema';
import { LibraryTopicsResponse } from '@/types/topic';
import { WidgetFilter, WidgetType } from '@/types/widget';

import { mockWidgets } from './mocks/widget.mock';

export async function getTopicsOverview(page = 1): Promise<LibraryTopicsResponse> {
  if (process.env.MOCK_MODE === 'true') {
    return mockLibraryTopics;
  }

  try {
    const { data: recentTopics, error: recentTopicsError } = await TopicService.loadRecentTopics();
    const skipIds = recentTopics?.map((topic) => topic.id) || [];
    const { data: topicsPage, error: topicsPageError } = await getLibraryTopicsPage(page, skipIds);

    return {
      recentTopics,
      recentTopicsError,
      topicsPage,
      topicsPageError,
    };
  } catch {
    return { recentTopics: undefined, topicsPage: undefined, recentTopicsError: 'something went wrong' };
  }
}

export async function getTopicById(topicId: number): Promise<TopicOverview | undefined> {
  if (process.env.MOCK_MODE === 'true') {
    const topic = mockLibraryTopics?.recentTopics?.[0];
    const widgets = mockWidgets;

    if (topic == undefined) return;

    return { ...topic, widgets };
  }

  return await TopicService.getTopicById(topicId);
}

export async function getQuestions(topicId: number, filter: WidgetFilter): Promise<QuestionInfo[]> {
  if (process.env.MOCK_MODE === 'true') {
    let questions = mockQuestions;

    questions = questions.filter((q) => q.topicId === 1);

    if (filter !== undefined) {
      questions = questions.filter((q) => (filter === 'all' ? q.type !== WidgetType.FlipCard : q.type === filter));
    }

    return questions;
  }

  return QuestionService.loadQuestions(topicId, filter);
}
