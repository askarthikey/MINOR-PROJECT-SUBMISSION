import { z } from 'zod';

import { LanguageCode } from '@/services/locale/locale.service';

import { LocaleString, LocaleStringSchema } from './locale-schemas';
import { WidgetOverviewSchema } from './widget-schema';

export enum Level {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export type LevelFilter = Level | 'all';

const LEVEL_SET = new Set<string>(Object.values(Level));

export function isLevel(value: string | undefined): value is Level {
  return value !== undefined && LEVEL_SET.has(value);
}

export function toLevelFilter(value: string | undefined): LevelFilter | undefined {
  if (value === 'all') return 'all';

  return isLevel(value) ? value : undefined;
}

export enum Subject {
  javascript = 'JavaScript',
  typescript = 'TypeScript',
}

export const LevelLocales: Record<Level, LocaleString> = {
  [Level.beginner]: {
    [LanguageCode.en]: 'beginner',
    [LanguageCode.ru]: 'начинающий',
    [LanguageCode.by]: 'пачатковец',
  },
  [Level.intermediate]: {
    [LanguageCode.en]: 'intermediate',
    [LanguageCode.ru]: 'средний',
    [LanguageCode.by]: 'сярэдні',
  },
  [Level.advanced]: {
    [LanguageCode.en]: 'advanced',
    [LanguageCode.ru]: 'продвинутый',
    [LanguageCode.by]: 'прасунуты',
  },
};

export const TopicBaseSchema = z.object({
  id: z.number().int(),
  name: LocaleStringSchema,
  level: z.enum(Level),
  description: LocaleStringSchema,
  subject: z.enum(Subject),
  created_at: z.coerce.date(),
});
export type TopicBase = z.infer<typeof TopicBaseSchema>;

export const mapTopicBaseFields = (data: TopicBase) => ({
  id: data.id,
  name: data.name,
  level: data.level,
  description: data.description,
  subject: data.subject,
  createdAt: data.created_at,
});

export const TopicSchema = TopicBaseSchema.omit({ created_at: true });
export type Topic = z.infer<typeof TopicSchema>;

export const TopicAdminListItemSchema = TopicBaseSchema.extend({
  sum_questions: z.number().int().nonnegative().default(0),
}).transform((data) => {
  const base = mapTopicBaseFields(data);

  return {
    ...base,
    sumQuestions: data.sum_questions,
  };
});
export type TopicAdminListItem = z.infer<typeof TopicAdminListItemSchema>;

export const TopicOverviewSchema = TopicBaseSchema.extend({
  last_accessed_at: z.coerce.date().nullable(),
  widgets: z.array(z.lazy(() => WidgetOverviewSchema)).default([]),
}).transform((data) => {
  const base = mapTopicBaseFields(data);

  return {
    ...base,
    progress: calculateProgress(
      data.widgets.reduce((sum, widget) => sum + widget.correctAnswers, 0),
      data.widgets.reduce((sum, widget) => sum + widget.totalQuestions, 0)
    ),
    lastTrainedAt: data.last_accessed_at ?? undefined,
    widgets: data.widgets,
    correctAnswers: data.widgets.reduce((sum, widget) => sum + widget.correctAnswers, 0),
    totalQuestions: data.widgets.reduce((sum, widget) => sum + widget.totalQuestions, 0),
  };
});
export type TopicOverview = z.infer<typeof TopicOverviewSchema>;

const calculateProgress = (correctAnswers: number, totalQuestions: number) => {
  if (totalQuestions === 0) return 0;

  return (correctAnswers / totalQuestions) * 100;
};
