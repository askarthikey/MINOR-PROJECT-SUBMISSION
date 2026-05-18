import { codeOrderingValidationStrategy } from '@/services/validation/strategies/code-ordering-validation.strategy';
import { WidgetType } from '@/types/widget';

import { asyncSorterValidationStrategy } from './async-sorter-validation.strategy';
import { bigOValidationStrategy } from './big-o-validation.strategy';
import { codeCompletionValidationStrategy } from './code-completion-validation.strategy';
import { flipCardValidationStrategy } from './flip-card-validation.strategy';
import { quizValidationStrategy } from './quiz-validation.strategy';
import { trueFalseValidationStrategy } from './true-false-validation.strategy';
import { ValidationStrategy } from './types';

export const validationStrategies: Record<WidgetType, ValidationStrategy> = {
  [WidgetType.Quiz]: quizValidationStrategy,
  [WidgetType.TrueFalse]: trueFalseValidationStrategy,
  [WidgetType.CodeCompletion]: codeCompletionValidationStrategy,
  [WidgetType.FlipCard]: flipCardValidationStrategy,
  [WidgetType.BigONotation]: bigOValidationStrategy,
  [WidgetType.CodeOrdering]: codeOrderingValidationStrategy,
  [WidgetType.AsyncSorter]: asyncSorterValidationStrategy,
};
