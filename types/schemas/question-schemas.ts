import { z } from 'zod';

import { WidgetType } from '../widget';
import { LocaleStringSchema } from './locale-schemas';
import {
  AsyncSorterPayloadAnswerSchema,
  AsyncSorterPayloadQuestionSchema,
  BigOPayloadAnswerSchema,
  BigOPayloadQuestionSchema,
  CodeCompletionPayloadAnswerSchema,
  CodeCompletionPayloadQuestionSchema,
  CodeOrderingPayloadAnswerSchema,
  CodeOrderingPayloadQuestionSchema,
  FlipCardPayloadQuestionSchema,
  QuizPayloadAnswerSchema,
  QuizPayloadQuestionSchema,
  TrueFalsePayloadAnswerSchema,
  TrueFalsePayloadQuestionSchema,
} from './question-payload-schema';

export const QuestionBaseSchema = z.object({
  id: z.number().int(),
  topic_id: z.number().int(),
  widget_type: z.enum(WidgetType),
  created_at: z.coerce.date(),
});
export type QuestionBase = z.infer<typeof QuestionBaseSchema>;

export const GeneralQuestionSchema = z.object({
  id: z.number().int(),
  topicId: z.number().int(),
  widgetType: z.enum(WidgetType),
  payloadQuestion: z.unknown(),
  payloadAnswer: z.unknown().nullable(),
});
export type GeneralQuestion = z.infer<typeof GeneralQuestionSchema>;

export const QuestionAdminListItemSchema = QuestionBaseSchema.extend({
  topic_name: LocaleStringSchema,
  payload_question: z.unknown(),
  payload_answer: z.unknown().nullable(),
}).transform((data) => ({
  id: data.id,
  widgetType: data.widget_type,
  createdAt: data.created_at,
  payloadQuestion: data.payload_question,
  payloadAnswer: data.payload_answer,
  topicName: data.topic_name,
  topicId: data.topic_id,
}));
export type QuestionAdminListItem = z.infer<typeof QuestionAdminListItemSchema>;

export const UniversalPayloadQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(WidgetType.Quiz),
    data: QuizPayloadQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.TrueFalse),
    data: TrueFalsePayloadQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.CodeCompletion),
    data: CodeCompletionPayloadQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.FlipCard),
    data: FlipCardPayloadQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.BigONotation),
    data: BigOPayloadQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.CodeOrdering),
    data: CodeOrderingPayloadQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.AsyncSorter),
    data: AsyncSorterPayloadQuestionSchema,
  }),
]);
export type UniversalPayloadQuestion = z.output<typeof UniversalPayloadQuestionSchema>;

export const UniversalPayloadAnswerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(WidgetType.Quiz),
    data: QuizPayloadAnswerSchema,
  }),
  z.object({
    type: z.literal(WidgetType.TrueFalse),
    data: TrueFalsePayloadAnswerSchema,
  }),
  z.object({
    type: z.literal(WidgetType.CodeCompletion),
    data: CodeCompletionPayloadAnswerSchema,
  }),
  z.object({
    type: z.literal(WidgetType.FlipCard),
    data: z.null(),
  }),
  z.object({
    type: z.literal(WidgetType.BigONotation),
    data: BigOPayloadAnswerSchema,
  }),
  z.object({
    type: z.literal(WidgetType.CodeOrdering),
    data: CodeOrderingPayloadAnswerSchema,
  }),
  z.object({
    type: z.literal(WidgetType.AsyncSorter),
    data: AsyncSorterPayloadAnswerSchema,
  }),
]);
export type UniversalPayloadAnswer = z.output<typeof UniversalPayloadAnswerSchema>;

export const BlankQuestionSchema = GeneralQuestionSchema.omit({
  payloadAnswer: true,
  payloadQuestion: true,
});
export type BlankQuestion = z.infer<typeof BlankQuestionSchema>;

export const QuizQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: QuizPayloadQuestionSchema,
  payloadAnswer: QuizPayloadAnswerSchema,
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const TrueFalseQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: TrueFalsePayloadQuestionSchema,
  payloadAnswer: TrueFalsePayloadAnswerSchema,
});
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;

export const CodeCompletionQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: CodeCompletionPayloadQuestionSchema,
  payloadAnswer: CodeCompletionPayloadAnswerSchema,
});
export type CodeCompletionQuestion = z.infer<typeof CodeCompletionQuestionSchema>;

export const FlipCardQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: FlipCardPayloadQuestionSchema,
});
export type FlipCardQuestion = z.infer<typeof FlipCardQuestionSchema>;

export const BigOQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: BigOPayloadQuestionSchema,
  payloadAnswer: BigOPayloadAnswerSchema,
});
export type BigOQuestion = z.infer<typeof BigOQuestionSchema>;

export const CodeOrderingQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: CodeOrderingPayloadQuestionSchema,
  payloadAnswer: CodeOrderingPayloadAnswerSchema,
});
export type CodeOrderingQuestion = z.infer<typeof CodeOrderingQuestionSchema>;

export const AsyncSorterQuestionSchema = BlankQuestionSchema.extend({
  payloadQuestion: AsyncSorterPayloadQuestionSchema,
  payloadAnswer: AsyncSorterPayloadAnswerSchema,
});
export type AsyncSorterQuestion = z.infer<typeof AsyncSorterQuestionSchema>;

export const UniversalQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(WidgetType.Quiz),
    data: QuizQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.TrueFalse),
    data: TrueFalseQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.CodeCompletion),
    data: CodeCompletionQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.FlipCard),
    data: FlipCardQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.BigONotation),
    data: BigOQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.CodeOrdering),
    data: CodeOrderingQuestionSchema,
  }),
  z.object({
    type: z.literal(WidgetType.AsyncSorter),
    data: AsyncSorterQuestionSchema,
  }),
]);
export type UniversalQuestion = z.output<typeof UniversalQuestionSchema>;

export const QuestionInfoSchema = z
  .object({
    id: z.number().int(),
    topic_id: z.number().int(),
    widget_type: z.enum(WidgetType),
    payload_question: z.unknown(),
    payload_answer: z.unknown().nullable(),
    is_success: z.boolean().nullish(),
    updated_at: z.coerce.date().nullish(),
  })
  .transform((data) => {
    const parsed = UniversalPayloadQuestionSchema.parse({
      type: data.widget_type,
      data: data.payload_question,
    });

    return {
      id: data.id,
      topicId: data.topic_id,
      type: parsed.type,
      payload: parsed.data,
      isSuccess: data.is_success ?? false,
      updatedAt: data.updated_at ?? undefined,
    };
  });
export type QuestionInfo = z.output<typeof QuestionInfoSchema>;
