'use server';
import { ValidationResult } from '@/types/validation';

export async function validateAnswer(): Promise<ValidationResult> {
  return { isCorrect: Math.random() < 0.5 };
}
