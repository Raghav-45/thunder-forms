import { TableCell, TableRow } from '@/components/ui/table'
import { flexRender, type Row } from '@tanstack/react-table'
import type { FormTableRow } from '../types/form'

interface FormTableRowRendererProps {
  row: Row<FormTableRow>
}

export function FormTableRowRenderer({
  row,
}: FormTableRowRendererProps) {
  return (
    <TableRow data-state={row.getIsSelected() && 'selected'}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}
