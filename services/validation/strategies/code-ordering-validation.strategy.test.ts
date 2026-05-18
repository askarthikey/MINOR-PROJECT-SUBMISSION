import { ValidationQuestion } from '@/data/supabase/validate.supabase';
import { WidgetType } from '@/types/widget';

import { codeOrderingValidationStrategy } from './code-ordering-validation.strategy';

const buildQuestion = (overrides: Partial<ValidationQuestion> = {}): ValidationQuestion => ({
  widgetType: WidgetType.CodeOrdering,
  payloadQuestion: {
    description: { en: 'Order the code', ru: 'Упорядочь код', by: 'Упарадкуй код' },
    lines: ['a', 'b', 'c'],
  },
  payloadAnswer: {
    answers: [1, 0, 2],
  },
  ...overrides,
});

describe('codeOrderingValidationStrategy', () => {
  it('returns per-item details for a partially correct order', async () => {
    const result = await codeOrderingValidationStrategy.validate({
      answer: [1, 2, 0],
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: false,
      details: {
        blankResults: [true, false, false],
      },
    });
  });

  it('returns true for a correct order', async () => {
    const result = await codeOrderingValidationStrategy.validate({
      answer: [1, 0, 2],
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: true,
      details: {
        blankResults: [true, true, true],
      },
    });
  });

  it('supports legacy string input by parsing numeric sequences', async () => {
    const result = await codeOrderingValidationStrategy.validate({
      answer: '1,0,2',
      question: buildQuestion(),
    });

    expect(result).toEqual({
      isCorrect: true,
      details: {
        blankResults: [true, true, true],
      },
    });
  });

  it('returns undefined correctness for invalid submitted input', async () => {
    const result = await codeOrderingValidationStrategy.validate({
      answer: ['1', '0', '2'],
      question: buildQuestion(),
    });

    expect(result).toEqual({ isCorrect: undefined });
  });
});
