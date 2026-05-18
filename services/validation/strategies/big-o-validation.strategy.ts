import { BigOPayloadAnswerSchema } from '@/types/schemas/question-payload-schema';

import { ValidationStrategy } from './types';

export const bigOValidationStrategy: ValidationStrategy = {
  validate: async ({ answer, question }) => {
    const answerResult = await BigOPayloadAnswerSchema.safeParseAsync(question.payloadAnswer);

    if (!answerResult.success || typeof answer !== 'string') {
      return { isCorrect: undefined };
    }

    return { isCorrect: answer === answerResult.data.correctComplexity };
  },
};
