'use client';

import { DevTool } from '@hookform/devtools';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { CustomInput } from '@/components/CustomInput';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  AsyncSorterQuestion,
  AsyncSorterQuestionSchema,
  BigOQuestion,
  BigOQuestionSchema,
  BlankQuestion,
  CodeCompletionQuestion,
  CodeCompletionQuestionSchema,
  CodeOrderingQuestion,
  CodeOrderingQuestionSchema,
  FlipCardQuestion,
  FlipCardQuestionSchema,
  QuizQuestion,
  QuizQuestionSchema,
  TrueFalseQuestion,
  TrueFalseQuestionSchema,
} from '@/types/schemas/question-schemas';
import { WidgetType } from '@/types/widget';

import { PayloadFields } from './PayloadFields';

export type FullQuestion =
  | QuizQuestion
  | TrueFalseQuestion
  | CodeCompletionQuestion
  | FlipCardQuestion
  | BigOQuestion
  | CodeOrderingQuestion
  | AsyncSorterQuestion;

type QuestionDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FullQuestion) => void;
  defaultValues?: BlankQuestion;
  topics: { id: number; name: string }[];
};

export const QuestionDialog = ({ open, onOpenChange, onSubmit, defaultValues, topics }: QuestionDialogProperties) => {
  const [selectedTopicId, setSelectedTopicId] = useState<number>(defaultValues?.topicId ?? 0);
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>(defaultValues?.widgetType ?? WidgetType.Quiz);
  const lastResetKey = useRef<string | null>(null);

  const activeSchema = useMemo(() => {
    const schemaMap = {
      [WidgetType.Quiz]: QuizQuestionSchema,
      [WidgetType.TrueFalse]: TrueFalseQuestionSchema,
      [WidgetType.CodeCompletion]: CodeCompletionQuestionSchema,
      [WidgetType.FlipCard]: FlipCardQuestionSchema,
      [WidgetType.BigONotation]: BigOQuestionSchema,
      [WidgetType.CodeOrdering]: CodeOrderingQuestionSchema,
      [WidgetType.AsyncSorter]: AsyncSorterQuestionSchema,
    };

    const selected = schemaMap[selectedWidget];

    return selected;
  }, [selectedWidget]);

  const methods = useForm<FullQuestion>({
    resolver: zodResolver(activeSchema),
    defaultValues,
  });

  const id = 'question-form';
  const formKey = defaultValues?.id ?? 'new';
  const newMode = defaultValues?.id === 0;

  const onInternalSubmit = (data: FullQuestion) => {
    onSubmit(data);
  };

  const {
    reset,
    formState: { isValid, errors },
    control,
  } = methods;

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('validation error', errors);
    }
  });

  useEffect(() => {
    if (!open) return;

    const currentKey = `${defaultValues?.id}-${selectedWidget}-${selectedTopicId}`;
    if (lastResetKey.current === currentKey) return;

    lastResetKey.current = currentKey;

    const finalValues = {
      ...defaultValues,
      id: defaultValues?.id ?? 0,
      topicId: selectedTopicId ?? topics[0],
      widgetType: selectedWidget ?? WidgetType.Quiz,
    };

    reset(finalValues);
  }, [defaultValues, open, reset, selectedTopicId, selectedWidget, topics]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90%] flex-col sm:max-w-150">
        <DialogHeader className="border-b-2 pb-4">
          <DialogTitle>
            <DialogDescription className="hidden">
              {newMode ? 'Add New Question' : `Edit Question with ID: ${defaultValues?.id}`}
            </DialogDescription>
            {newMode ? 'Add New Question' : `Edit Question with ID: ${defaultValues?.id}`}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto px-4" key={formKey}>
          <FormProvider {...methods}>
            <form id={id} className="w-full" onSubmit={methods.handleSubmit(onInternalSubmit)}>
              <div className={cn('mb-2 grid w-full grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2')}>
                <CustomInput name="id" label="Question ID" type={'number'} readonly={true} />
                <CustomSelect<number>
                  name="topicId"
                  label="Topic"
                  options={topics.map((pair) => ({ label: pair.name, value: pair.id }))}
                  readonly={!newMode}
                  onChange={{
                    validator: Number,
                    act: (value) => {
                      setSelectedTopicId(value);
                    },
                  }}
                />
                <CustomSelect<WidgetType>
                  name="widgetType"
                  label="Widget Type"
                  options={Object.values(WidgetType).map((type) => ({ label: type, value: type }))}
                  readonly={!newMode}
                  onChange={{
                    validator: (value) => Object.values(WidgetType).find((type) => type == value),
                    act: (value) => {
                      setSelectedWidget(value);
                    },
                  }}
                />
                <div className="col-span-2">
                  <PayloadFields widgetType={selectedWidget} key={selectedWidget} />
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
        <Button variant="success" form={id} type="submit" disabled={!isValid}>
          Submit
        </Button>
        {process.env.NODE_ENV === 'development' && <DevTool control={control} placement="top-right" />}
      </DialogContent>
    </Dialog>
  );
};
