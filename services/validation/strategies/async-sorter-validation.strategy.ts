import { AsyncSorterAnswer } from '@/components/library/widget/ui/async-sorter/type';
import {
  AsyncSorterPayloadAnswerSchema,
  AsyncSorterPayloadQuestionSchema,
} from '@/types/schemas/question-payload-schema';

import { ValidationStrategy } from './types';

const ASYNC_SORTER_ZONES: (keyof AsyncSorterAnswer)[] = ['callStack', 'microtasks', 'macrotasks', 'outputOrder'];

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isAsyncSorterAnswer = (value: unknown): value is AsyncSorterAnswer => {
  if (typeof value !== 'object' || value === null) return false;

  return ASYNC_SORTER_ZONES.every((zone) => isStringArray(Reflect.get(value, zone)));
};

const isEqualStringArray = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const asyncSorterValidationStrategy: ValidationStrategy = {
  validate: async ({ answer, question }) => {
    const [questionResult, answerResult] = await Promise.all([
      AsyncSorterPayloadQuestionSchema.safeParseAsync(question.payloadQuestion),
      AsyncSorterPayloadAnswerSchema.safeParseAsync(question.payloadAnswer),
    ]);

    if (!questionResult.success || !answerResult.success || !isAsyncSorterAnswer(answer)) {
      return { isCorrect: undefined };
    }

    const expectedAnswer = answerResult.data;
    const zoneResults = {
      callStack: answer.callStack.map((blockId, index) => expectedAnswer.callStack[index] === blockId),
      microtasks: answer.microtasks.map((blockId, index) => expectedAnswer.microtasks[index] === blockId),
      macrotasks: answer.macrotasks.map((blockId, index) => expectedAnswer.macrotasks[index] === blockId),
      outputOrder: answer.outputOrder.map((blockId, index) => expectedAnswer.outputOrder[index] === blockId),
    };

    return {
      isCorrect: ASYNC_SORTER_ZONES.every((zone) => isEqualStringArray(answer[zone], expectedAnswer[zone])),
      details: {
        zoneResults,
      },
    };
  },
};
