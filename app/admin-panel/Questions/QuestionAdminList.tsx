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
import { deleteQuestions, getAllQuestions, upsertQuestion } from '@/data/client/question.client';
import { getTopicIdNamePairs } from '@/data/client/topic.client';
import { BlankQuestion, GeneralQuestionSchema, QuestionAdminListItem } from '@/types/schemas/question-schemas';
import { WidgetType } from '@/types/widget';

import { createColumns } from '../Questions/columns';
import { FullQuestion, QuestionDialog } from './QuestionDialog';

export default function QuestionAdminList() {
  const [questions, setQuestions] = useState<QuestionAdminListItem[] | undefined>();
  const [topics, setTopics] = useState<{ id: number; name: string }[] | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<BlankQuestion | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);

  const isModalOpening = useRef(false);

  const handleOpenDialog = (data?: BlankQuestion) => {
    if (isModalOpening.current) return;

    isModalOpening.current = true;

    if (topics == undefined) return;

    const fallback = {
      id: 0,
      topicId: topics[0].id,
      widgetType: WidgetType.Quiz,
    };

    if (data == undefined) {
      data = fallback;
    }

    setSelectedQuestion(data);
    setIsDialogOpen(true);

    setTimeout(() => {
      isModalOpening.current = false;
    }, 100);
  };

  const handleSubmit = async (formData: FullQuestion) => {
    const parsed = GeneralQuestionSchema.safeParse(formData);

    if (parsed.success) {
      const { data, error } = await upsertQuestion(parsed.data).finally(() => setIsDialogOpen(false));

      if (error != undefined) {
        toast.error(error);
      }

      if (data) {
        if (parsed.data.id === 0) {
          setQuestions((previous) => [data, ...(previous || [])]);
          toast.success('Added new Question');
        } else {
          setQuestions((previous) => previous?.map((topic) => (topic.id === data.id ? data : topic)));
          toast.success('Updated existing Question');
        }
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
    const { error } = await deleteQuestions(idsToDelete);

    if (error != undefined) {
      toast.error(error);

      return;
    }

    setQuestions((previous) => previous?.filter((topic) => !idsToDelete.includes(topic.id)));
    toast.success(`Deleted ${idsToDelete.length} item(s)`);

    setIdsToDelete([]);
  };

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data, error } = await getAllQuestions();

        if (error != undefined) {
          toast.error(error);
        }

        if (data != undefined) {
          setQuestions(data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();

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
        {!isLoading && questions && (
          <DataTable columns={createColumns({ handleOpenDialog, confirmDelete })} data={questions}></DataTable>
        )}
        {topics && isDialogOpen && (
          <QuestionDialog
            topics={topics}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={handleSubmit}
            defaultValues={selectedQuestion}
          />
        )}
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {idsToDelete.length} Questions
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
      {!isLoading && !questions && <div>Failed to load items</div>}
    </>
  );
}
