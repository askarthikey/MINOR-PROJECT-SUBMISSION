import { ValidationStrategy } from './types';

export const flipCardValidationStrategy: ValidationStrategy = {
  validate: async ({ answer }) => {
    if (typeof answer === 'boolean') {
      return { isCorrect: answer };
    }

    return { isCorrect: false };
  },
};
