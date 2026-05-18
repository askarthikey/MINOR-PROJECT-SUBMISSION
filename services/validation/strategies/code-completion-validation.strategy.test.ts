import { ValidationQuestion } from '@/data/supabase/validate.supabase';
import { WidgetType } from '@/types/widget';

import { codeCompletionValidationStrategy } from './code-completion-validation.strategy';

const buildQuestion = (overrides: Partial<ValidationQuestion> = {}): ValidationQuestion => ({
  widgetType: WidgetType.CodeCompletion,
  payloadQuestion: {
    code: 'const result = arr.___(x => x > 0).___(x => x * 2);',
    blanks: ['___', '___'],
    hints: [],
  },
  payloadAnswer: {
    answers: ['filter', 'map'],
  },
  ...overrides,
});

describe('codeCompletionValidationStrategy', () => {
  it('returns true for matching multiple answers', async () => {
    const result = await codeCompletionValidationStrategy.validate({
      answer: ['filter', 'map'],
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: true,
      details: {
        blankResults: [true, true],
      },
    });
  });

  it('trims text answers before comparing', async () => {
    const result = await codeCompletionValidationStrategy.validate({
      answer: [' filter ', ' map '],
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: true,
      details: {
        blankResults: [true, true],
      },
    });
  });

  it('returns false for a wrong multiple-answer submission', async () => {
    const result = await codeCompletionValidationStrategy.validate({
      answer: ['filter', 'reduce'],
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: false,
      details: {
        blankResults: [true, false],
      },
    });
  });

  it('returns false for a wrong answer count', async () => {
    const result = await codeCompletionValidationStrategy.validate({
      answer: ['filter'],
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: false,
      details: {
        blankResults: [true, false],
      },
    });
  });

  it('returns false when payloadAnswer has an unsupported shape', async () => {
    const result = await codeCompletionValidationStrategy.validate({
      answer: ['filter', 'map'],
      question: buildQuestion({
        payloadAnswer: {
          value: ['filter', 'map'],
        },
      }),
    });

    expect(result).toEqual({ isCorrect: undefined });
  });
});
