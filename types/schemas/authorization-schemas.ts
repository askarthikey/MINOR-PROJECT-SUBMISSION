import z from 'zod';

import { UserRole } from '@/lib/routes';

const usernameCheck = /^[a-zA-Z0-9_-]+$/;
const passwordMinLength = 6;
const upperCaseCheck = /[A-Z]/;

export const SignInSchema = z.object({
  email: z.email({ message: 'validation.email_invalid' }),
  password: z.string().min(1, 'validation.required'),
});
export type SignIn = z.infer<typeof SignInSchema>;

const signUpFields = SignInSchema.omit({ password: true }).extend({
  password: z
    .string()
    .min(passwordMinLength, 'validation.password_too_short')
    .refine((v) => upperCaseCheck.test(v), 'validation.uppercase'),
  username: z
    .string()
    .min(3, 'validation.username_too_short')
    .max(12, 'validation.username_too_long')
    .refine((v) => usernameCheck.test(v), 'validation.username_invalid'),
  confirmPassword: z.string(),
});

export const SignUpSchema = signUpFields.superRefine(({ confirmPassword, password }, context) => {
  if (confirmPassword !== password) {
    context.addIssue({
      message: 'validation.password_mismatch',
      path: ['confirmPassword'],
      code: 'custom',
    });
  }
});
export type SignUp = z.infer<typeof SignUpSchema>;

export const UserDetailsSchema = signUpFields.omit({ password: true, confirmPassword: true }).extend({
  id: z.string(),
  role: z.nativeEnum(UserRole),
});
export type UserDetails = z.infer<typeof UserDetailsSchema>;
