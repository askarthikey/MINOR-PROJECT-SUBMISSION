'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, MessageSquarePlus } from 'lucide-react';

import { LocaleStringTooltip } from '@/components/LocaleStringTooltip';
import { Button } from '@/components/ui/button';
import { getWidgetIcon } from '@/lib/widget-icon';
import { Widget, WidgetAdminListItem } from '@/types/schemas/widget-schema';
import { WidgetType } from '@/types/widget';

type MetaProperties = {
  handleOpenDialog: (data: Widget) => void;
  handleAddQuestion: (widgetType: WidgetType) => void;
};

export function createColumns({ handleOpenDialog, handleAddQuestion }: MetaProperties) {
  const columns: ColumnDef<WidgetAdminListItem>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-nowrap">
          <span>{row.original.type}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name (EN)',
      cell: ({ row }) => <LocaleStringTooltip data={row.original.name} />,
    },
    {
      accessorKey: 'description',
      header: 'description',
      cell: ({ row }) => <LocaleStringTooltip data={row.original.description} />,
    },
    {
      accessorKey: 'icon',
      header: 'Icon',
      cell: ({ row }) => getWidgetIcon(row.original.type),
    },
    {
      accessorKey: 'sumQuestions',
      header: 'Questions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-nowrap">
          <span>{row.original.sumQuestions}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => row.original.createdAt?.toLocaleDateString() ?? 'N/A',
    },
    {
      id: 'actions',
      cell: ({ row, table }) => {
        const isDisabled = table.getSelectedRowModel().rows.length > 0;

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-green-700 hover:text-green-900"
              disabled={isDisabled}
              onClick={() => handleAddQuestion(row.original.type)}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
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
          </div>
        );
      },
    },
  ];

  return columns;
}
