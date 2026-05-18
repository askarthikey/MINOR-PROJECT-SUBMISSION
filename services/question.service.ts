import { getQuestions } from '@/data/supabase/questions.supabase';
import { QuestionInfo } from '@/types/schemas/question-schemas';
import { WidgetFilter } from '@/types/widget';

export const QuestionService = {
  loadQuestions: (topicId: number, widgetType: WidgetFilter): Promise<QuestionInfo[]> => {
    return getQuestions(topicId, widgetType);
  },
};
