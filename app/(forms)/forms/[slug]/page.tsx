'use client'

import { useEffect, useState } from 'react'
import { getFormById } from '@/lib/dbUtils'
import { toast } from 'sonner'
import { FormFieldOrGroup } from '@/types/types'
import { FormPreview } from '@/components/form-preview'
import SkeletonPage from '../skeleton/page'

interface PageProps {
  params: {
    slug: string
  }
}

export default function Page({ params }: PageProps) {
  // BASIC FORM DETAILS
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  // BASIC FORM DETAILS

  const [formFields, setFormFields] = useState<FormFieldOrGroup[]>([])

  const [loading, setLoading] = useState(true)
  const { slug } = params

  useEffect(() => {
    getFormById(slug)
      .then((formData) => {
        if (formData?.fields) {
          setFormFields(formData.fields)
          setFormName(formData.title || 'New form')
          setFormDescription(
            formData.description || 'Lorem ipsum dolor sit amet'
          )
          setLoading(false)
        } else {
          toast.error('Failed to load form data')
        }
      })
      .catch((error) => {
        console.error('Error fetching form data:', error)
        toast.error('Error loading form data')
      })
  }, [slug]) // Only depends on slug

  if (loading) return <SkeletonPage />
  return (
    <div className="md:container space-y-6 p-4 pt-16 md:p-10 pb-16">
      <div className="space-y-0.5 md:space-y-1">
        <h2 className="text-2xl md:text-5xl font-bold tracking-tight">
          {formName ?? 'N/A'}
        </h2>
        <p className="text-muted-foreground">{formDescription ?? 'N/A'}</p>
      </div>
      <div className="space-y-4">
        {formFields && formFields?.length > 0 && (
          <div>
            <FormPreview formFields={formFields} behaveAsPreview={true} />
          </div>
        )}
      </div>
    </div>
  )
}
