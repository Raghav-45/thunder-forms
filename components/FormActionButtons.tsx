'use client'

import { FC } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useGenerationStore } from './GenerationStore'
import { FormType } from '@/types/types'

interface FormActionButtonsProps {
  form: FormType
}

const FormActionButtons: FC<FormActionButtonsProps> = ({ form }) => {
  const { userForms, setUserForms } = useGenerationStore()

  async function handleDeleteForm(id: string) {
    if (!id || !userForms) {
      return
    }

    // try {
    //   const response = await fetch(`/api/forms/${id}/delete`, {
    //     method: 'DELETE',
    //   })
    //   if (!response.ok) throw new Error('Failed to delete form')
    //   setUserForms(userForms.filter((form) => form.id !== id))
    // } catch (error) {
    //   console.error('Error deleting form:', error)
    // }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-haspopup="true" size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Link href={`/dashboard/builder/${form.id}`}>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={() => handleDeleteForm(form.id)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FormActionButtons
