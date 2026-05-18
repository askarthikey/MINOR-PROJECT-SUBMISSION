import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/DataTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { upsertQuestion } from '@/data/client/question.client';
import { deleteTopics, getAllTopics, upsertTopic } from '@/data/client/topic.client';
import { BlankQuestion, GeneralQuestionSchema } from '@/types/schemas/question-schemas';
import { SchemaData } from '@/types/schemas/schema-registry';
import { Topic, TopicAdminListItem, TopicBaseSchema } from '@/types/schemas/topic-schema';
import { WidgetType } from '@/types/widget';

import { FullQuestion, QuestionDialog } from '../Questions/QuestionDialog';
import { createColumns } from './columns';
import { TopicDialog } from './TopicDialog';

export default function TopicAdminList() {
  const [topics, setTopics] = useState<TopicAdminListItem[] | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>();
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [questionDefaults, setQuestionDefaults] = useState<BlankQuestion | undefined>();

  const isModalOpening = useRef(false);

  const handleOpenDialog = (data?: Topic) => {
    if (isModalOpening.current || isQuestionDialogOpen) return;

    isModalOpening.current = true;
    setSelectedTopic(data);
    setIsTopicDialogOpen(true);

    setTimeout(() => {
      isModalOpening.current = false;
    }, 100);
  };

  const handleAddQuestion = (topicId: number) => {
    if (isModalOpening.current || isTopicDialogOpen) return;

    const defaultValue: BlankQuestion = { id: 0, topicId, widgetType: WidgetType.Quiz };

    isModalOpening.current = true;
    setQuestionDefaults(defaultValue);

    setIsQuestionDialogOpen(true);

    setTimeout(() => {
      isModalOpening.current = false;
    }, 100);
  };

  const handleSubmit = async (formData: SchemaData) => {
    const parsed = TopicBaseSchema.omit({ created_at: true }).safeParse(formData);

    if (parsed.success) {
      const { data, error } = await upsertTopic(parsed.data).finally(() => setIsTopicDialogOpen(false));

      if (error != undefined) {
        toast.error(error);
      }

      if (data) {
        if (parsed.data.id === 0) {
          setTopics((previous) => [data, ...(previous || [])]);
          toast.success('Added new topic');
        } else {
          setTopics((previous) => previous?.map((topic) => (topic.id === data.id ? data : topic)));
          toast.success('Updated existing topic');
        }
      }
    } else {
      toast.error('Failed to parse form data correctly');
    }
  };

  const handleQuestionSubmit = async (formData: FullQuestion) => {
    const parsed = GeneralQuestionSchema.safeParse(formData);

    if (parsed.success) {
      const { data, error } = await upsertQuestion(parsed.data).finally(() => setIsQuestionDialogOpen(false));

      if (error != undefined) {
        toast.error(error);
      }

      if (data) {
        setTopics((previous) =>
          previous?.map((topic) =>
            topic.id === data.topicId ? { ...topic, sumQuestion: (topic.sumQuestions += 1) } : topic
          )
        );
        toast.success('Added new Question');
      }
    } else {
      toast.error('Failed to parse form data correctly');
    }
  };

  const confirmDelete = async (ids: number[]) => {
    if (ids.length === 0) return;

    setIdsToDelete(ids);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    const { error } = await deleteTopics(idsToDelete);

    if (error != undefined) {
      toast.error(error);

      return;
    }

    setTopics((previous) => previous?.filter((topic) => !idsToDelete.includes(topic.id)));
    toast.success(`Deleted ${idsToDelete.length} item(s)`);

    setIdsToDelete([]);
  };

  useEffect(() => {
    async function fetchTopics() {
      try {
        const { data, error } = await getAllTopics();

        if (error != undefined) {
          toast.error(error);
        }

        if (data != undefined) {
          setTopics(data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchTopics();
  }, []);

  return (
    <>
      {isLoading && <div>Waiting for response from server...</div>}
      {!isLoading && topics && (
        <>
          <DataTable columns={createColumns({ handleOpenDialog, confirmDelete, handleAddQuestion })} data={topics} />
          <TopicDialog
            open={isTopicDialogOpen}
            onOpenChange={setIsTopicDialogOpen}
            defaultValues={selectedTopic}
            onSubmit={handleSubmit}
          />
          {isQuestionDialogOpen && (
            <QuestionDialog
              open={isQuestionDialogOpen}
              onOpenChange={setIsQuestionDialogOpen}
              onSubmit={handleQuestionSubmit}
              topics={topics.map((topic) => ({ id: topic.id, name: topic.name.en }))}
              defaultValues={questionDefaults}
            />
          )}
          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {idsToDelete.length} Topics and related
                  questions from database
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {!isLoading && !topics && <div>Failed to load items</div>}
    </>
  );
}
