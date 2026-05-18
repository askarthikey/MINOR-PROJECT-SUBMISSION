import { z } from 'zod';

import { WidgetType } from '../widget';
import { LocaleStringSchema } from './locale-schemas';

export const WidgetBaseSchema = z.object({
  type: z.enum(WidgetType),
  name: LocaleStringSchema,
  description: LocaleStringSchema,
  created_at: z.coerce.date(),
});
export type WidgetBase = z.infer<typeof WidgetBaseSchema>;

export const mapWidgetBaseFields = (data: WidgetBase) => ({
  type: data.type,
  name: data.name,
  description: data.description,
  createdAt: data.created_at,
});

export const WidgetSchema = WidgetBaseSchema.omit({ created_at: true });
export type Widget = z.infer<typeof WidgetSchema>;

const WidgetExtendedSchema = WidgetBaseSchema.extend({
  last_accessed_at: z.coerce.date().nullable(),
  total_questions: z.number(),
  correct_answers: z.number(),
});
export const WidgetOverviewSchema = WidgetExtendedSchema.transform((data) => {
  const base = mapWidgetBaseFields(data);

  return {
    ...base,
    createdAt: data.created_at,
    totalQuestions: data.total_questions,
    correctAnswers: data.correct_answers,
  };
});
export type WidgetOverview = z.infer<typeof WidgetOverviewSchema>;

export const WidgetAdminListItemSchema = WidgetBaseSchema.extend({
  sum_questions: z.number(),
}).transform((data) => {
  const base = mapWidgetBaseFields(data);

  return {
    ...base,
    sumQuestions: data.sum_questions,
  };
});
export type WidgetAdminListItem = z.infer<typeof WidgetAdminListItemSchema>;

export const AllWidgetSchema = WidgetExtendedSchema.omit({ type: true })
  .extend({
    type: z.literal('all'),
  })
  .transform((data) => ({
    type: 'all',
    name: data.name,
    description: data.description,
    totalQuestions: data.total_questions,
    correctAnswers: data.correct_answers,
  }));
export type AllWidget = z.infer<typeof AllWidgetSchema>;
