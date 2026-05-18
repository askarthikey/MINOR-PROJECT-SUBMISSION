'use client';

import { useState } from 'react';

import { CustomForm } from '@/components/CustomForm';
import { CustomInput } from '@/components/CustomInput';
import { LocaleInput } from '@/components/LocaleInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SchemaData } from '@/types/schemas/schema-registry';
import { Widget } from '@/types/schemas/widget-schema';

type WidgetDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SchemaData) => void;
  defaultValues?: Widget;
};

export const WidgetDialog = ({ open, onOpenChange, onSubmit, defaultValues }: WidgetDialogProperties) => {
  const [formValid, setFormValid] = useState(false);

  const formKey = defaultValues?.type ?? 'new';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={formKey} className="flex max-h-[90%] flex-col sm:max-w-150">
        <DialogHeader className="border-b-2 pb-4">
          <DialogTitle>
            <DialogDescription className="hidden">`Edit Widget: ${defaultValues?.type}`</DialogDescription>
            Edit Widget: {defaultValues?.type}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto px-4">
          <CustomForm
            id="widget-form"
            schemaKey="WidgetSchema"
            onSubmit={(data) => onSubmit(data)}
            onValidationChange={setFormValid}
            className="gap-y-10"
            defaultValues={defaultValues}
          >
            <CustomInput name="type" label="Widget Type" type="text" readonly={true} />
            <LocaleInput name="name" label="Widget Name" />
            <LocaleInput name="description" label="Widget Description" />
            <CustomInput name="icon" label="Icon" type="text" />
          </CustomForm>
        </div>
        <Button variant="success" form="widget-form" type="submit" disabled={!formValid}>
          Submit
        </Button>
      </DialogContent>
    </Dialog>
  );
};
