import { getValidationQuestion } from '@/data/supabase/validate.supabase';
import { ValidationResult } from '@/types/validation';
import { WidgetType } from '@/types/widget';

import { validationStrategies } from './validation/strategies';

export const ValidationService = {
  validateAnswer: async (questionId: number, type: WidgetType, answer: unknown): Promise<ValidationResult> => {
    if (type === WidgetType.FlipCard)
      return validationStrategies[type].validate({
        answer,
        question: {
          widgetType: WidgetType.Quiz,
          payloadQuestion: undefined,
          payloadAnswer: undefined,
        },
      });

    const question = await getValidationQuestion(questionId);

    return validationStrategies[type].validate({
      answer,
      question,
    });
  },
};
