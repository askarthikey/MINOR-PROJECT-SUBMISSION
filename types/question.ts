import {
  AsyncSorterPayloadAnswer,
  AsyncSorterPayloadQuestion,
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
import { CodeOrderingQuestion } from '@/types/schemas/question-schemas';
import { WidgetType } from '@/types/widget';

export type WidgetQuestionPayloadMap = {
  [WidgetType.Quiz]: QuizPayloadQuestion;
  [WidgetType.TrueFalse]: TrueFalsePayloadQuestion;
  [WidgetType.CodeCompletion]: CodeCompletionPayloadQuestion;
  [WidgetType.FlipCard]: FlipCardPayloadQuestion;
  [WidgetType.BigONotation]: BigOPayloadQuestion;
  [WidgetType.CodeOrdering]: CodeOrderingQuestion;
  [WidgetType.AsyncSorter]: AsyncSorterPayloadQuestion;
};

export type WidgetAnswerPayloadMap = {
  [WidgetType.Quiz]: QuizPayloadAnswer;
  [WidgetType.TrueFalse]: TrueFalsePayloadAnswer;
  [WidgetType.CodeCompletion]: CodeCompletionPayloadAnswer;
  [WidgetType.FlipCard]: null;
  [WidgetType.BigONotation]: BigOPayloadAnswer;
  [WidgetType.CodeOrdering]: CodeOrderingPayloadAnswer;
  [WidgetType.AsyncSorter]: AsyncSorterPayloadAnswer;
};

export type WidgetPayloadMap = {
  [WidgetType.Quiz]: QuizPayloadQuestion;
  [WidgetType.TrueFalse]: TrueFalsePayloadQuestion;
  [WidgetType.CodeCompletion]: CodeCompletionPayloadQuestion;
  [WidgetType.FlipCard]: FlipCardPayloadQuestion;
  [WidgetType.BigONotation]: BigOPayloadQuestion;
  [WidgetType.CodeOrdering]: CodeOrderingPayloadQuestion;
  [WidgetType.AsyncSorter]: AsyncSorterPayloadQuestion;
};

export type AnswerPayload = WidgetAnswerPayloadMap[WidgetType];
