import { z } from 'zod';

import { LocaleStringSchema } from './locale-schemas';

export enum BigOComplexity {
  Constant = 'O(1)',
  Logarithmic = 'O(log n)',
  Linear = 'O(n)',
  Linearithmic = 'O(n log n)',
  Quadratic = 'O(n^2)',
}

/// Payload Question Schemas
export const QuizPayloadQuestionSchema = z.object({
  question: LocaleStringSchema,
  options: z.array(LocaleStringSchema),
});
export type QuizPayloadQuestion = z.infer<typeof QuizPayloadQuestionSchema>;

export const TrueFalsePayloadQuestionSchema = z.object({
  statement: LocaleStringSchema,
  explanation: LocaleStringSchema.nullish(),
});
export type TrueFalsePayloadQuestion = z.infer<typeof TrueFalsePayloadQuestionSchema>;

export const CodeCompletionPayloadQuestionSchema = z.object({
  code: z.string(),
  blanks: z.array(z.string()).min(1),
  hints: z.array(LocaleStringSchema).nullish(),
});
export type CodeCompletionPayloadQuestion = z.infer<typeof CodeCompletionPayloadQuestionSchema>;

export const FlipCardPayloadQuestionSchema = z.object({
  term: LocaleStringSchema,
  definition: LocaleStringSchema,
});
export type FlipCardPayloadQuestion = z.infer<typeof FlipCardPayloadQuestionSchema>;

export const BigOPayloadQuestionSchema = z.object({
  question: LocaleStringSchema,
  codeExample: z.string(),
});
export type BigOPayloadQuestion = z.infer<typeof BigOPayloadQuestionSchema>;

export const CodeOrderingPayloadQuestionSchema = z.object({
  description: LocaleStringSchema,
  lines: z.array(z.string()).min(1),
});
export type CodeOrderingPayloadQuestion = z.infer<typeof CodeOrderingPayloadQuestionSchema>;

export const BlockSchema = z.object({
  id: z.string(),
  code: z.string(),
  label: z.string(),
});
export type Block = z.infer<typeof BlockSchema>;

export const AsyncSorterPayloadQuestionSchema = z.object({
  codeSnippet: z.string(),
  blocks: z.array(BlockSchema).min(1),
});
export type AsyncSorterPayloadQuestion = z.infer<typeof AsyncSorterPayloadQuestionSchema>;

export type AnyQuestionPayload =
  | QuizPayloadQuestion
  | TrueFalsePayloadQuestion
  | CodeCompletionPayloadQuestion
  | CodeOrderingPayloadQuestion
  | FlipCardPayloadQuestion
  | BigOPayloadQuestion
  | AsyncSorterPayloadQuestion;

/// Payload Answer Schemas
export const QuizPayloadAnswerSchema = z.object({
  correctIndex: z.number().min(1).max(4),
});
export type QuizPayloadAnswer = z.infer<typeof QuizPayloadAnswerSchema>;

export const TrueFalsePayloadAnswerSchema = z.object({
  correct: z.boolean(),
});
export type TrueFalsePayloadAnswer = z.infer<typeof TrueFalsePayloadAnswerSchema>;

export const CodeCompletionPayloadAnswerSchema = z.object({
  answers: z.array(z.string()).min(1),
});
export type CodeCompletionPayloadAnswer = z.infer<typeof CodeCompletionPayloadAnswerSchema>;

export const BigOPayloadAnswerSchema = z.object({
  correctComplexity: z.enum(BigOComplexity),
});
export type BigOPayloadAnswer = z.infer<typeof BigOPayloadAnswerSchema>;

export const CodeOrderingPayloadAnswerSchema = z.object({
  answers: z.array(z.number().int()).min(1),
});
export type CodeOrderingPayloadAnswer = z.infer<typeof CodeOrderingPayloadAnswerSchema>;

export const AsyncSorterPayloadAnswerSchema = z.object({
  callStack: z.array(z.string()),
  microtasks: z.array(z.string()),
  macrotasks: z.array(z.string()),
  outputOrder: z.array(z.string()),
});
export type AsyncSorterPayloadAnswer = z.infer<typeof AsyncSorterPayloadAnswerSchema>;
