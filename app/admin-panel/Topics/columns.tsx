'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, MessageSquarePlus, PlusCircle, Trash2 } from 'lucide-react';

import { LocaleStringTooltip } from '@/components/LocaleStringTooltip';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Level, Topic, TopicAdminListItem } from '@/types/schemas/topic-schema';

type MetaProperties = {
  handleOpenDialog: (data?: Topic) => void;
  confirmDelete: (ids: number[]) => void;
  handleAddQuestion: (topicId: number) => void;
};

export function createColumns({ handleOpenDialog, confirmDelete, handleAddQuestion }: MetaProperties) {
  const columns: ColumnDef<TopicAdminListItem>[] = [
    {
      accessorKey: 'id',
      header: ({ table }) => (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            className="border-amber-700 bg-slate-50"
            onClick={(event) => event.stopPropagation()}
          />
          <span>ID</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-nowrap">
          <Checkbox
            checked={row.getIsSelected()}
            className="border-amber-700 bg-slate-50"
            onCheckedChange={(value) => row.toggleSelected(value === true)}
          />
          <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
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
      header: 'Description (EN)',
      cell: ({ row }) => <LocaleStringTooltip data={row.original.description} />,
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => {
        const level = row.original.level;
        const variants: Record<Level, 'default' | 'secondary' | 'outline'> = {
          [Level.beginner]: 'secondary',
          [Level.intermediate]: 'default',
          [Level.advanced]: 'outline',
        };
        return <Badge variant={variants[level]}>{level}</Badge>;
      },
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = row.original.subject;
        return <Badge variant="secondary">{subject}</Badge>;
      },
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
      cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
    },
    {
      id: 'actions',
      header: ({ table }) => {
        const selectedRows = table.getSelectedRowModel().rows;
        const rowSelected = selectedRows.length > 0;

        return (
          <div className="flex w-full justify-end gap-2 py-2">
            <Button variant="success" disabled={rowSelected} onClick={() => handleOpenDialog()}>
              <PlusCircle className="h-4 w-4" />
              Add Topic
            </Button>
            <Button
              variant="destructive"
              size="icon"
              disabled={!rowSelected}
              onClick={() => confirmDelete(selectedRows.map((row) => row.original.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row, table }) => {
        const isDisabled = table.getSelectedRowModel().rows.length > 0;

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-green-700 hover:text-green-900"
              disabled={isDisabled}
              onClick={() => handleAddQuestion(row.original.id)}
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
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              disabled={isDisabled}
              onClick={() => confirmDelete([row.original.id])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return columns;
}
