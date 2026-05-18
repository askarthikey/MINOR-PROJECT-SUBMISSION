'use client';

import { useState } from 'react';

import { CustomForm } from '@/components/CustomForm';
import { CustomInput } from '@/components/CustomInput';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { SchemaData } from '@/types/schemas/schema-registry';

export default function SignInForm({ handleSubmit }: { handleSubmit: (data: SchemaData) => void }) {
  const [formValid, setFormValid] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t('button.sign-in')}</h1>
      <CustomForm id="sign-in-form" schemaKey="SignInSchema" onSubmit={handleSubmit} onValidationChange={setFormValid}>
        <CustomInput name="email" label={t('auth.form.email')} type="email" classes="md:col-span-2" />
        <CustomInput name="password" label={t('auth.form.password')} type="password" classes="md:col-span-2" />
      </CustomForm>
      <Button variant={'success'} form={'sign-in-form'} type="submit" className="my-3 w-full" disabled={!formValid}>
        {t('button.sign-in')}
      </Button>
    </>
  );
}
