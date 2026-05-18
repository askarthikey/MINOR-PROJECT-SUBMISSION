'use server';
import { validateAnswer as mockValidateAnswer } from '@/data/mocks/validate.mock';
import { ValidationService } from '@/services/validation.service';
import { ValidationResult } from '@/types/validation';
import { WidgetType } from '@/types/widget';

export async function validateAnswer(questionId: number, type: WidgetType, answer: unknown): Promise<ValidationResult> {
  if (process.env.MOCK_MODE === 'true') {
    return mockValidateAnswer();
  }

  return ValidationService.validateAnswer(questionId, type, answer);
}
