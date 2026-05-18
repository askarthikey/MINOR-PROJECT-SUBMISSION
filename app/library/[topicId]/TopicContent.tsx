'use client';

import { notFound } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import NotFound from '@/app/not-found';
import DefaultRunner from '@/components/library/widget/runners/default/DefaultRunner';
import { SliderRunner } from '@/components/library/widget/runners/slider/SliderRunner';
import WidgetList from '@/components/WidgetList';
import { getQuestions, getTopicById } from '@/data/trainer.api';
import { useTranslation } from '@/hooks/use-translation';
import { toPositiveInteger } from '@/lib/parse-id';
import { QuestionInfo } from '@/types/schemas/question-schemas';
import { TopicOverview } from '@/types/schemas/topic-schema';
import { toWidgetFilter, WidgetType } from '@/types/widget';

import { WidgetListSkeleton } from './WidgetListSkeleton';

type TopicContentProperties = {
  topicId: string;
  widgetType: string | undefined;
};

export default function TopicContent({ topicId, widgetType }: TopicContentProperties) {
  const [topic, setTopic] = useState<TopicOverview | undefined>();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [allQuestions, setAllQuestions] = useState<QuestionInfo[] | undefined>();
  const [repeatCount, setRepeatCount] = useState<number>(0);

  const { translate } = useTranslation();
  const selectedFilter = toWidgetFilter(widgetType);

  useEffect(() => {
    const parsedId = toPositiveInteger(topicId);

    if (parsedId === undefined) {
      notFound();
    }

    getTopicById(parsedId)
      .then((result) => {
        if (!result) setIsNotFound(true);
        setTopic(result);
      })
      .catch(() => notFound());
  }, [topicId, setTopic]);

  useEffect(() => {
    if (selectedFilter === undefined) return;

    const parsedId = toPositiveInteger(topicId);
    if (parsedId === undefined) {
      notFound();
    }

    getQuestions(parsedId, selectedFilter).then((data) => setAllQuestions(data));
  }, [topicId, selectedFilter]);

  const activeQuestions = useMemo(() => {
    const active = allQuestions?.filter((q) => q.isSuccess === null || q.isSuccess === false) ?? [];

    if (active.length === 0 && repeatCount >= 0) {
      return allQuestions ?? [];
    }

    return active;
  }, [allQuestions, repeatCount]);

  const handleFinishRound = () => {
    setRepeatCount((previous) => (previous += 1));
  };

  const showRunner = selectedFilter != undefined && allQuestions != undefined;

  const showSlider = selectedFilter === WidgetType.FlipCard;

  if (isNotFound) {
    return NotFound();
  }

  if (!topic) {
    return WidgetListSkeleton();
  }

  return (
    <>
      <section className="space-y-2 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{translate(topic?.name)}</h1>
      </section>
      <section className="pt-10">
        {showRunner ? (
          showSlider ? (
            <SliderRunner questions={activeQuestions} onComplete={handleFinishRound} />
          ) : (
            <DefaultRunner questions={activeQuestions} onComplete={handleFinishRound} />
          )
        ) : (
          <WidgetList
            widgets={topic?.widgets}
            topicId={topicId}
            totalQuestions={topic.totalQuestions}
            correctAnswers={topic.correctAnswers}
          />
        )}
      </section>
    </>
  );
}
