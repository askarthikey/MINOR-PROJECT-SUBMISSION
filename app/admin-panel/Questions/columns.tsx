'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';

import { LocaleStringTooltip } from '@/components/LocaleStringTooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { LocaleStringSchema } from '@/types/schemas/locale-schemas';
import {
  BigOPayloadAnswer,
  BigOPayloadQuestion,
  CodeCompletionPayloadAnswer,
  CodeCompletionPayloadQuestion,
  CodeOrderingPayloadAnswer,
  CodeOrderingPayloadQuestion,
  FlipCardPayloadQuestion,
  QuizPayloadAnswer,
  QuizPayloadQuestion,
  TrueFalsePayloadAnswer,
  TrueFalsePayloadQuestion,
} from '@/types/schemas/question-payload-schema';
import {
  GeneralQuestion,
  QuestionAdminListItem,
  UniversalPayloadAnswerSchema,
  UniversalPayloadQuestionSchema,
} from '@/types/schemas/question-schemas';
import { WidgetType } from '@/types/widget';

type MetaProperties = {
  handleOpenDialog: (data?: GeneralQuestion) => void;
  confirmDelete: (ids: number[]) => void;
};

export function createColumns({ handleOpenDialog, confirmDelete }: MetaProperties) {
  const columns: ColumnDef<QuestionAdminListItem>[] = [
    {
      accessorKey: 'id',
      header: ({ table }) => (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            className="border-amber-700 bg-slate-50"
            onClick={(event) => event.stopPropagation()}
          />
          <span>ID</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-nowrap">
          <Checkbox
            className="border-amber-700 bg-slate-50"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
          />
          <span>{row.original.id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'widgetType',
      header: 'Widget Type',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-nowrap">
          <span>{row.original.widgetType}</span>
        </div>
      ),
    },
    {
      accessorKey: 'topicName',
      header: 'Topic Name (EN)',
      cell: ({ row }) => <LocaleStringTooltip data={row.original.topicName} />,
    },
    {
      accessorKey: 'payloadQuestion',
      header: 'Payload Question',
      cell: ({ row }) => (
        <div className="flex flex-col justify-start gap-1.5 align-top">
          {displayPayloadQuestion(row.original.payloadQuestion, row.original.widgetType)}
        </div>
      ),
    },
    {
      accessorKey: 'payloadAnswer',
      header: 'Payload Answer',
      cell: ({ row }) => (
        <div className="flex flex-col justify-start gap-1.5 align-top">
          {displayPayloadAnswer(row.original.payloadAnswer, row.original.widgetType)}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
    },
    {
      id: 'actions',
      header: ({ table }) => {
        const selectedRows = table.getSelectedRowModel().rows;
        const rowSelected = selectedRows.length > 0;

        return (
          <div className="flex w-full justify-end gap-2 py-2">
            <Button variant="success" disabled={rowSelected} onClick={() => handleOpenDialog()}>
              <PlusCircle className="h-4 w-4" />
              Add Question
            </Button>
            <Button
              variant="destructive"
              size="icon"
              disabled={!rowSelected}
              onClick={() => confirmDelete(selectedRows.map((row) => row.original.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row, table }) => {
        const isDisabled = table.getSelectedRowModel().rows.length > 0;

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-600 hover:text-blue-900"
              disabled={isDisabled}
              onClick={() => {
                handleOpenDialog(row.original);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              disabled={isDisabled}
              onClick={() => confirmDelete([row.original.id])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return columns;
}

const displayPayloadQuestion = (question: unknown, widgetString: string) => {
  const widgetType = Object.values(WidgetType).find((widget) => widget === widgetString);
  if (widgetType == undefined) return 'Could not match widgetType';

  const parsed = UniversalPayloadQuestionSchema.safeParse({
    type: widgetType,
    data: question,
  });

  if (parsed.success) {
    switch (parsed.data.type) {
      case WidgetType.Quiz: {
        return displayQuizPayloadQuestion(parsed.data.data);
      }
      case WidgetType.TrueFalse: {
        return displayTrueFalsePayloadQuestion(parsed.data.data);
      }
      case WidgetType.CodeCompletion: {
        return displayCodeCompletionPayloadQuestion(parsed.data.data);
      }
      case WidgetType.CodeOrdering: {
        return displayCodeOrderingPayloadQuestion(parsed.data.data);
      }
      case WidgetType.FlipCard: {
        return displayFlipCardPayloadQuestion(parsed.data.data);
      }
      case WidgetType.BigONotation: {
        return displayBigOPayloadQuestion(parsed.data.data);
      }
    }
  }

  return <span className="text-red-500">Parse failed</span>;
};

const displayQuizPayloadQuestion = (question: QuizPayloadQuestion) => {
  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Question:</span>
        <LocaleStringTooltip data={question.question} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
      </div>
      <div className="mt-1 flex flex-wrap justify-start gap-2">
        <span className="font-bold text-slate-500">Option:</span>
        {question.options.map((option, index) => (
          <LocaleStringTooltip
            data={option}
            key={index}
            className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs"
          />
        ))}
      </div>
    </>
  );
};

const displayTrueFalsePayloadQuestion = (question: TrueFalsePayloadQuestion) => {
  const explanation = LocaleStringSchema.safeParse(question.explanation);

  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Statement: </span>
        <LocaleStringTooltip data={question.statement} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
      </div>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Explanation: </span>
        {explanation.success && (
          <LocaleStringTooltip data={explanation.data} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
        )}
      </div>
    </>
  );
};

const displayCodeCompletionPayloadQuestion = (question: CodeCompletionPayloadQuestion) => {
  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Code: </span>
        <p className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs">{question.code}</p>
      </div>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">blanks: </span>
        <p className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs">{question.blanks.join(', ')}</p>
      </div>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">hints: </span>
        {question.hints?.map((hint, index) => (
          <LocaleStringTooltip data={hint} key={index} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
        ))}
      </div>
    </>
  );
};

const displayCodeOrderingPayloadQuestion = (question: CodeOrderingPayloadQuestion) => {
  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Description: </span>
        <LocaleStringTooltip
          data={question.description}
          className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs"
        />
      </div>
      <div className="flex flex-col justify-start gap-2 align-super">
        <span className="font-bold text-slate-500">Lines: </span>
        <div className="flex w-min flex-col justify-start gap-1 rounded-sm border bg-slate-50 px-2 py-0.5 align-super text-xs">
          {question.lines.map((line, index) => (
            <p key={index}>
              {index + 1}: {line}
            </p>
          ))}
        </div>
      </div>
    </>
  );
};

const displayFlipCardPayloadQuestion = (question: FlipCardPayloadQuestion) => {
  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Term: </span>
        <LocaleStringTooltip data={question.term} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
      </div>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Definition: </span>
        <LocaleStringTooltip data={question.definition} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
      </div>
    </>
  );
};

const displayBigOPayloadQuestion = (question: BigOPayloadQuestion) => {
  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Question: </span>
        <LocaleStringTooltip data={question.question} className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs" />
      </div>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Example: </span>
        <p className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs">{question.codeExample}</p>
      </div>
    </>
  );
};

const displayPayloadAnswer = (answer: unknown, widgetString: string) => {
  const widgetType = Object.values(WidgetType).find((widget) => widget === widgetString);
  if (widgetType === undefined) return 'Could not match widgetType';

  if (widgetType === WidgetType.FlipCard) {
    return <p className="text-gray-500 italic">N/A</p>;
  }

  const parsed = UniversalPayloadAnswerSchema.safeParse({
    type: widgetType,
    data: answer,
  });

  if (parsed.success) {
    switch (parsed.data.type) {
      case WidgetType.Quiz: {
        return displayQuizPayloadAnswer(parsed.data.data);
      }
      case WidgetType.TrueFalse: {
        return displayTrueFalsePayloadAnswer(parsed.data.data);
      }
      case WidgetType.CodeCompletion: {
        return displayCodeCompletionPayloadAnswer(parsed.data.data);
      }
      case WidgetType.BigONotation: {
        return displayBigOPayloadAnswer(parsed.data.data);
      }
      case WidgetType.CodeOrdering: {
        return displayCodeOrderingPayloadAnswer(parsed.data.data);
      }
    }
  }

  return <span className="text-red-500">Parse failed</span>;
};

const displayQuizPayloadAnswer = (answer: QuizPayloadAnswer) => {
  return (
    <div className="flex justify-start gap-1">
      <span className="font-bold text-slate-500">Cor. Id: </span>
      <p className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs">{answer.correctIndex}</p>
    </div>
  );
};

const displayTrueFalsePayloadAnswer = (answer: TrueFalsePayloadAnswer) => {
  return (
    <>
      <div className="flex justify-start gap-1">
        <span className="font-bold text-slate-500">Correct Value: </span>
        <p
          className={cn(
            'rounded-sm border bg-slate-50 px-2 py-0.5 text-xs',
            answer.correct ? 'text-green-600' : 'text-red-600'
          )}
        >
          {answer.correct ? 'True' : 'False'}
        </p>
      </div>
    </>
  );
};

const displayCodeCompletionPayloadAnswer = (answer: CodeCompletionPayloadAnswer) => {
  return (
    <div className="flex justify-start gap-1">
      <span className="font-bold text-slate-500">Answers: </span>
      <p className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs">{answer.answers.join(' -> ')}</p>
    </div>
  );
};

const displayBigOPayloadAnswer = (answer: BigOPayloadAnswer) => {
  return (
    <div className="flex justify-start gap-1">
      <span className="font-bold text-slate-500">Expected Complexity: </span>
      <code className="rounded-sm bg-slate-100 px-1">{answer.correctComplexity}</code>
    </div>
  );
};

const displayCodeOrderingPayloadAnswer = (answer: CodeOrderingPayloadAnswer) => {
  return (
    <div className="flex justify-start gap-1">
      <span className="font-bold text-slate-500">Answers: </span>
      <p className="rounded-sm border bg-slate-50 px-2 py-0.5 text-xs">{answer.answers.join(' -> ')}</p>
    </div>
  );
};
