import { TrueFalsePayloadAnswerSchema } from '@/types/schemas/question-payload-schema';

import { ValidationStrategy } from './types';

export const trueFalseValidationStrategy: ValidationStrategy = {
  validate: async ({ answer, question }) => {
    const answerResult = await TrueFalsePayloadAnswerSchema.safeParseAsync(question.payloadAnswer);

    if (!answerResult.success || typeof answer !== 'string') {
      return { isCorrect: undefined };
    }

    return { isCorrect: answer === String(answerResult.data.correct) };
  },
};
