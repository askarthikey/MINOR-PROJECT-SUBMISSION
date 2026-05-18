'use client';

import { useState } from 'react';

import { CustomForm } from '@/components/CustomForm';
import { CustomInput } from '@/components/CustomInput';
import { CustomSelect } from '@/components/CustomSelect';
import { LocaleInput } from '@/components/LocaleInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SchemaData } from '@/types/schemas/schema-registry';
import { Level, Subject, Topic } from '@/types/schemas/topic-schema';

type TopicDefault = Omit<Topic, 'name' | 'description'> & Partial<Pick<Topic, 'name' | 'description'>>;

type TopicDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SchemaData) => void;
  defaultValues?: TopicDefault;
};

export const TopicDialog = ({ open, onOpenChange, onSubmit, defaultValues }: TopicDialogProperties) => {
  const fallback: TopicDefault = {
    id: 0,
    level: Level.beginner,
    subject: Subject.javascript,
  };

  if (defaultValues == undefined) {
    defaultValues = fallback;
  }

  const [formValid, setFormValid] = useState(false);

  const formKey = defaultValues?.id || 'new';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={formKey} className="flex max-h-[90%] flex-col sm:max-w-150">
        <DialogHeader className="border-b-2 pb-4">
          <DialogTitle>
            <DialogDescription className="hidden">
              {defaultValues.id === 0 ? 'Add New Topic' : `Edit Topic with ID: ${defaultValues.id}`}
            </DialogDescription>
            {defaultValues.id === 0 ? 'Add New Topic' : `Edit Topic with ID: ${defaultValues.id}`}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto px-4">
          <CustomForm
            id="topic-form"
            schemaKey="TopicSchema"
            onSubmit={(data) => onSubmit(data)}
            onValidationChange={setFormValid}
            className="gap-y-10"
            defaultValues={defaultValues}
          >
            <CustomInput name="id" label="Topic ID" type={'number'} readonly={true} />
            <LocaleInput name="name" label="Topic Name" />
            <LocaleInput name="description" label="Topic Description" />
            <CustomSelect<Level>
              name="level"
              label="Difficulty Level"
              options={Object.values(Level).map((level) => ({ label: level, value: level }))}
            />
            <CustomSelect<Subject>
              name="subject"
              label="Subject"
              options={Object.values(Subject).map((subject) => ({ label: subject, value: subject }))}
            />
          </CustomForm>
        </div>
        <Button variant="success" form="topic-form" type="submit" disabled={!formValid}>
          Submit
        </Button>
      </DialogContent>
    </Dialog>
  );
};
