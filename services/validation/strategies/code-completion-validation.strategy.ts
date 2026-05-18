import {
  CodeCompletionPayloadAnswerSchema,
  CodeCompletionPayloadQuestionSchema,
} from '@/types/schemas/question-payload-schema';

import { ValidationStrategy } from './types';

export const codeCompletionValidationStrategy: ValidationStrategy = {
  validate: async ({ answer, question }) => {
    const [questionResult, answerResult] = await Promise.all([
      CodeCompletionPayloadQuestionSchema.safeParseAsync(question.payloadQuestion),
      CodeCompletionPayloadAnswerSchema.safeParseAsync(question.payloadAnswer),
    ]);

    if (!questionResult.success || !answerResult.success) {
      return { isCorrect: undefined };
    }

    if (Array.isArray(answer) && answer.every((item) => typeof item === 'string')) {
      const submittedAnswers = answer.map((item) => item.trim());
      const expectedAnswers = answerResult.data.answers;

      if (expectedAnswers !== undefined) {
        const blankResults = expectedAnswers.map((value, index) => value === submittedAnswers[index]);

        return {
          isCorrect: blankResults.every(Boolean),
          details: {
            blankResults,
          },
        };
      }
    }

    return { isCorrect: undefined };
  },
};
