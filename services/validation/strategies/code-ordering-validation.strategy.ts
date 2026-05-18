import { CodeOrderingPayloadAnswerSchema } from '@/types/schemas/question-payload-schema';

import { isEqualNumberArray, parseNumberArray } from './helpers';
import { ValidationStrategy } from './types';

export const codeOrderingValidationStrategy: ValidationStrategy = {
  validate: async ({ answer, question }) => {
    const answerResult = await CodeOrderingPayloadAnswerSchema.safeParseAsync(question.payloadAnswer);

    if (!answerResult.success) {
      return { isCorrect: undefined };
    }

    const submittedOrder =
      Array.isArray(answer) && answer.every((item) => typeof item === 'number') ? answer : parseNumberArray(answer);

    if (submittedOrder === undefined) {
      return { isCorrect: undefined };
    }

    const expectedOrder = answerResult.data.answers;
    const blankResults = expectedOrder.map((value, index) => value === submittedOrder[index]);

    return {
      isCorrect: isEqualNumberArray(submittedOrder, expectedOrder),
      details: {
        blankResults,
      },
    };
  },
};
