import { ValidationQuestion } from '@/data/supabase/validate.supabase';
import { WidgetType } from '@/types/widget';

import { asyncSorterValidationStrategy } from './async-sorter-validation.strategy';

const buildQuestion = (overrides: Partial<ValidationQuestion> = {}): ValidationQuestion => ({
  widgetType: WidgetType.AsyncSorter,
  payloadQuestion: {
    codeSnippet:
      "console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');",
    blocks: [
      { id: 'b1', code: "console.log('1')", label: '1' },
      { id: 'b2', code: 'setTimeout callback', label: '2' },
      { id: 'b3', code: 'Promise.then callback', label: '3' },
      { id: 'b4', code: "console.log('4')", label: '4' },
    ],
  },
  payloadAnswer: {
    callStack: ['b1', 'b4'],
    microtasks: ['b3'],
    macrotasks: ['b2'],
    outputOrder: ['b1', 'b4', 'b3', 'b2'],
  },
  ...overrides,
});

describe('asyncSorterValidationStrategy', () => {
  it('returns per-zone results for a partially correct answer', async () => {
    const result = await asyncSorterValidationStrategy.validate({
      answer: {
        callStack: ['b1', 'b2'],
        microtasks: ['b3'],
        macrotasks: ['b4'],
        outputOrder: ['b1', 'b3', 'b4', 'b2'],
      },
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: false,
      details: {
        zoneResults: {
          callStack: [true, false],
          microtasks: [true],
          macrotasks: [false],
          outputOrder: [true, false, false, true],
        },
      },
    });
  });

  it('returns true for a correct answer', async () => {
    const result = await asyncSorterValidationStrategy.validate({
      answer: {
        callStack: ['b1', 'b4'],
        microtasks: ['b3'],
        macrotasks: ['b2'],
        outputOrder: ['b1', 'b4', 'b3', 'b2'],
      },
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: true,
      details: {
        zoneResults: {
          callStack: [true, true],
          microtasks: [true],
          macrotasks: [true],
          outputOrder: [true, true, true, true],
        },
      },
    });
  });

  it('returns undefined correctness for invalid submitted input', async () => {
    const result = await asyncSorterValidationStrategy.validate({
      answer: ['b1', 'b4', 'b3', 'b2'],
      question: buildQuestion(),
    });

    expect(result).toEqual({ isCorrect: undefined });
  });
});
