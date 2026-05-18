import { getServerLanguageCode } from '@/services/locale/locale.server';
import { QuizPayloadAnswerSchema, QuizPayloadQuestionSchema } from '@/types/schemas/question-payload-schema';

import { ValidationStrategy } from './types';

export const quizValidationStrategy: ValidationStrategy = {
  validate: async ({ answer, question }) => {
    const [questionResult, answerResult] = await Promise.all([
      QuizPayloadQuestionSchema.safeParseAsync(question.payloadQuestion),
      QuizPayloadAnswerSchema.safeParseAsync(question.payloadAnswer),
    ]);

    if (!questionResult.success || !answerResult.success || typeof answer !== 'string') {
      return { isCorrect: undefined };
    }

    const languageCode = await getServerLanguageCode();
    const correctOption = questionResult.data.options[answerResult.data.correctIndex - 1]?.[languageCode];

    return { isCorrect: correctOption !== undefined && answer === correctOption };
  },
};
