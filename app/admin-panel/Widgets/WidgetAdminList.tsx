import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/DataTable';
import { upsertQuestion } from '@/data/client/question.client';
import { getTopicIdNamePairs } from '@/data/client/topic.client';
import { getAllWidgets, updateWidget } from '@/data/client/widget.client';
import { BlankQuestion, GeneralQuestionSchema } from '@/types/schemas/question-schemas';
import { SchemaData } from '@/types/schemas/schema-registry';
import { Widget, WidgetAdminListItem, WidgetBaseSchema } from '@/types/schemas/widget-schema';
import { WidgetType } from '@/types/widget';

import { FullQuestion, QuestionDialog } from '../Questions/QuestionDialog';
import { createColumns } from './columns';
import { WidgetDialog } from './WidgetDialog';

export function TopicAdminList() {
  const [widgets, setWidgets] = useState<WidgetAdminListItem[] | undefined>();
  const [topics, setTopics] = useState<{ id: number; name: string }[] | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidget, setSelectedWidget] = useState<Widget | undefined>();
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [questionDefaults, setQuestionDefaults] = useState<BlankQuestion | undefined>();

  const isModalOpening = useRef(false);

  const handleOpenDialog = (data: Widget) => {
    if (isModalOpening.current) return;

    isModalOpening.current = true;
    setSelectedWidget(data);
    setIsWidgetDialogOpen(true);

    setTimeout(() => {
      isModalOpening.current = false;
    }, 100);
  };

  const handleAddQuestion = (widgetType: WidgetType) => {
    if (isModalOpening.current || isWidgetDialogOpen) return;

    const defaultValue: BlankQuestion = { id: 0, topicId: topics?.[0]?.id ?? 0, widgetType: widgetType };

    isModalOpening.current = true;
    setQuestionDefaults(defaultValue);

    setIsQuestionDialogOpen(true);

    setTimeout(() => {
      isModalOpening.current = false;
    }, 100);
  };

  const handleQuestionSubmit = async (formData: FullQuestion) => {
    const parsed = GeneralQuestionSchema.safeParse(formData);

    if (parsed.success) {
      const { data, error } = await upsertQuestion(parsed.data).finally(() => setIsQuestionDialogOpen(false));

      if (error != undefined) {
        toast.error(error);
      }

      if (data) {
        setWidgets((previous) =>
          previous?.map((widget) =>
            widget.type === data.widgetType ? { ...widget, sumQuestion: (widget.sumQuestions += 1) } : widget
          )
        );
        toast.success('Added new Question');
      }
    } else {
      toast.error('Failed to parse form data correctly');
    }
  };

  const handleSubmit = async (formData: SchemaData) => {
    const parsed = WidgetBaseSchema.omit({ created_at: true }).safeParse(formData);

    if (parsed.success) {
      const { data, error } = await updateWidget(parsed.data).finally(() => setIsWidgetDialogOpen(false));

      if (error != undefined) {
        toast.error(error);
      }

      if (data) {
        setWidgets((previous) =>
          previous?.map((widget) =>
            widget.type === data.type ? { ...data, sumQuestions: widget.sumQuestions } : widget
          )
        );
        toast.success('Updated existing topic');
      }
    } else {
      toast.error('Failed to parse form data correctly');
    }
  };

  useEffect(() => {
    async function fetchWidgets() {
      try {
        const { data, error } = await getAllWidgets();

        if (error != undefined) {
          toast.error(error);
        }

        if (data != undefined) {
          setWidgets(data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchWidgets();

    async function fetchTopics() {
      const { data, error } = await getTopicIdNamePairs();

      if (error != undefined) {
        toast.error(error);
      }

      if (data != undefined) {
        setTopics(data);
      }
    }
    fetchTopics();
  }, []);

  return (
    <>
      {isLoading && <div>Waiting for response from server...</div>}
      <>
        {!isLoading && widgets && (
          <DataTable columns={createColumns({ handleOpenDialog, handleAddQuestion })} data={widgets}></DataTable>
        )}
        <WidgetDialog
          open={isWidgetDialogOpen}
          onOpenChange={setIsWidgetDialogOpen}
          defaultValues={selectedWidget}
          onSubmit={handleSubmit}
        />
        {topics && isQuestionDialogOpen && (
          <QuestionDialog
            open={isQuestionDialogOpen}
            onOpenChange={setIsQuestionDialogOpen}
            onSubmit={handleQuestionSubmit}
            topics={topics}
            defaultValues={questionDefaults}
          />
        )}
      </>
      {!isLoading && !widgets && <div>Failed to load items</div>}
    </>
  );
}
