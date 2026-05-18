'use client';

import { useState } from 'react';

import { CustomForm } from '@/components/CustomForm';
import { CustomInput } from '@/components/CustomInput';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { SchemaData } from '@/types/schemas/schema-registry';

export default function SignUpForm({ handleSubmit }: { handleSubmit: (data: SchemaData) => void }) {
  const [formValid, setFormValid] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t('button.sign-up')}</h1>

      <CustomForm id="sign-up-form" schemaKey="SignUpSchema" onSubmit={handleSubmit} onValidationChange={setFormValid}>
        <CustomInput name="username" label={t('auth.form.username')} type="text" classes="md:col-span-2" />
        <CustomInput name="email" label={t('auth.form.email')} type="email" classes="md:col-span-2" />
        <CustomInput
          name="password"
          label={t('auth.form.password')}
          type="password"
          dependencies={['confirmPassword']}
        />
        <CustomInput name="confirmPassword" label={t('auth.form.confirm-password')} type="password" />
      </CustomForm>

      <Button variant={'success'} form={'sign-up-form'} type="submit" className="my-3 w-full" disabled={!formValid}>
        {t('button.sign-up')}
      </Button>
    </>
  );
}
