'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IconArchive,
  IconChevronDown,
  IconLayoutColumns,
  IconLoader,
} from '@tabler/icons-react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import * as React from 'react'
import { toast } from 'sonner'
import { FormTableActions } from './form-table-actions'
import { FormTableCellViewer } from './form-table-cell-viewer'
import { FormTableContent } from './form-table-content'
import { DeleteFormDialog } from './delete-form-dialog'
import type { FormTableRow } from '../types/form'

export { formTableSchema as schema } from '../types/form'

interface FormTableProps {
  data: FormTableRow[]
  isLoading?: boolean
}

export function FormTable({
  data: initialData,
  isLoading = false,
}: FormTableProps) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [activeTab, setActiveTab] = React.useState('all')
  const [deleteFormId, setDeleteFormId] = React.useState<string | null>(null)
  const [duplicatingFormId, setDuplicatingFormId] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  async function handleDuplicateForm(formId: string) {
    setDuplicatingFormId(formId)

    try {
      const response = await fetch(`/api/forms/${formId}/duplicate`, {
        method: 'POST',
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error || 'Failed to duplicate form')
        return
      }

      toast.success('Form duplicated')
      window.location.reload()
    } catch {
      toast.error('Failed to duplicate form')
    } finally {
      setDuplicatingFormId(null)
    }
  }

  const filteredData = React.useMemo(() => {
    if (activeTab === 'all') return data
    if (activeTab === 'active') {
      return data.filter((form) => form.status.startsWith('Active'))
    }
    if (activeTab === 'closed') {
      return data.filter((form) => form.status.startsWith('Closed'))
    }

    return data
  }, [activeTab, data])

  const formCounts = React.useMemo(() => {
    const active = data.filter((form) => form.status.startsWith('Active')).length
    const closed = data.filter((form) => form.status.startsWith('Closed')).length

    return { active, closed }
  }, [data])

  const columns: ColumnDef<FormTableRow>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center mx-3">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center mx-3">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'title',
        header: 'Header',
        cell: ({ row }) =>
          isLoading ? (
            <Skeleton key={row.index} className="h-4 w-[250px]" />
          ) : (
            <FormTableCellViewer item={row.original} />
          ),
        enableHiding: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          if (isLoading) {
            return (
              <Skeleton key={row.index} className="h-4 w-[50px] rounded-sm" />
            )
          }

          const [state, reason] = row.original.status.split(' | ')
          const isClosed = state === 'Closed'

          return (
            <Badge
              variant="outline"
              className="flex items-center space-x-0 text-muted-foreground"
            >
              {isClosed ? (
                <IconArchive className="w-4 h-4" />
              ) : (
                <IconLoader className="animate-spin w-4 h-4" />
              )}
              <span>{state}</span>
              <Separator
                orientation="vertical"
                className="!h-2.5 bg-neutral-500/80 dark:bg-neutral-400/80"
              />
              <span className="opacity-60">{reason}</span>
            </Badge>
          )
        },
      },
      {
        accessorKey: 'responses',
        header: 'Responses',
        cell: ({ row }) =>
          isLoading ? (
            <Skeleton key={row.index} className="h-4 w-[50px] rounded-sm" />
          ) : (
            row.original.responses
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'createdAt',
        cell: ({ row }) =>
          isLoading ? (
            <Skeleton key={row.index} className="h-4 w-[125px] rounded-sm" />
          ) : (
            row.original.createdAt
          ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <FormTableActions
            formId={row.original.id}
            isDuplicating={duplicatingFormId === row.original.id}
            onDuplicate={handleDuplicateForm}
            onDelete={setDeleteFormId}
          />
        ),
      },
    ],
    [duplicatingFormId, isLoading],
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">
            Active <Badge variant="secondary">{formCounts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed <Badge variant="secondary">{formCounts.closed}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide(),
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DeleteFormDialog
          deleteFormId={deleteFormId}
          setDeleteFormId={setDeleteFormId}
          afterFormDeleted={(id) => {
            setData((previousData) =>
              previousData.filter((item) => item.id !== id),
            )
          }}
        />
      </div>
      <FormTableContent
        columnCount={columns.length}
        emptyMessage="No results."
        table={table}
        value="all"
      />
      <FormTableContent
        columnCount={columns.length}
        emptyMessage="No active forms."
        table={table}
        value="active"
      />
      <FormTableContent
        columnCount={columns.length}
        emptyMessage="No closed forms."
        table={table}
        value="closed"
      />
    </Tabs>
  )
}
