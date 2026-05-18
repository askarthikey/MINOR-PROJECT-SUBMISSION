import { ValidationQuestion } from '@/data/supabase/validate.supabase';
import { ValidationResult } from '@/types/validation';

export type ValidationStrategyContext = {
  answer: unknown;
  question: ValidationQuestion;
};

export type ValidationStrategy = {
  validate: (context: ValidationStrategyContext) => Promise<ValidationResult>;
};
