'use client'

import { FieldConfig } from '@/components/FormBuilder/elements'
import { useFormStore } from '@/components/FormBuilder/store'
import { getFieldComponent } from '@/components/FormBuilder/utils/helperFunctions'
import { FormSubmittedPage } from '@/components/FormSubmittedPage'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FormPageProps {
  params: Promise<{ slug: string }>
}

export default function FormPage({ params }: FormPageProps) {
  const { formSettings, setFormSettings } = useFormStore()
  const { slug: currentFormId } = use(params)
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)

  const renderField = (field: FieldConfig) => {
    const FieldComponent = getFieldComponent(field.uniqueIdentifier)

    return (
      <div key={field.id} className="relative group">
        <div className="w-full">
          <FieldComponent
            // @ts-expect-error field properties not guaranteed across all variants
            field={field}
            // value={formData[field.id]}
            onChange={(value) => console.log(field.id, value)}
            // error={errors[field.id]}
          />
        </div>
      </div>
    )
  }

  const form = useQuery({
    queryKey: ['form', currentFormId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/forms/${currentFormId}`)
      return data
    },
    enabled: !!currentFormId,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  // Use useEffect to set state when form data is successfully loaded
  useEffect(() => {
    if (form.isError) {
      toast.error('Failed to load Form')
      return
    }

    if (form.isSuccess && form.data) {
      setFormSettings({
        title: form.data.title,
        description: form.data.description,
        expiresAt: new Date(form.data.expiresAt),
        maxSubmissions: form.data.maxSubmissions,
        redirectUrl: form.data.redirectUrl,
      })
      setFields(form.data.fields)
      console.log(form.data)
    }
  }, [form.isError, form.isSuccess, form.data, setFormSettings])

  // Handle loading state
  if (form.isLoading) {
    return <SkeletonPage />
  }

  // Handle empty fields state
  if (form.isError || !fields || fields.length === 0) {
    return <SkeletonPage />
  }

  if (isFormSubmitted) {
    return <FormSubmittedPage redirectUrl={formSettings.redirectUrl} />
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pt-16 md:p-10 pb-16">
      <div className="space-y-0.5 md:space-y-1">
        <h2 className="text-2xl md:text-5xl font-bold tracking-tight">
          {formSettings.title}
        </h2>
        <p className="text-muted-foreground">{formSettings.description}</p>
      </div>
      <div className="space-y-4 w-full">
        {fields.map((field) => renderField(field))}
      </div>
      <Button onClick={() => setIsFormSubmitted(true)}>Submit</Button>
    </div>
  )
}

// Skeleton component for loading state
function SkeletonPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 pt-16 md:p-10 pb-16">
      <div className="animate-pulse delay-0 space-y-1 md:space-y-1.5">
        <div className="animate-pulse delay-0 h-8 md:h-12 bg-neutral-700 rounded w-1/3 md:w-1/5"></div>
        <div className="animate-pulse delay-700 h-4 bg-neutral-700 rounded w-1/2 md:w-1/3"></div>
      </div>
      <div className="space-y-4 md:space-y-9">
        <div className="animate-pulse delay-0 grid w-full items-center gap-2 md:gap-3">
          <div className="animate-pulse delay-0 h-4 bg-neutral-700 rounded w-1/4"></div>
          <div className="animate-pulse delay-700 h-8 bg-neutral-700 rounded w-full"></div>
        </div>
        <div className="animate-pulse delay-500 grid w-full items-center gap-2 md:gap-3">
          <div className="animate-pulse delay-0 h-4 bg-neutral-700 rounded w-1/4"></div>
          <div className="animate-pulse delay-700 h-8 bg-neutral-700 rounded w-full"></div>
        </div>
        <div className="animate-pulse delay-1000 grid w-full items-center pt-4 md:pt-0 gap-2 md:gap-3">
          <div className="animate-pulse delay-1000 h-10 bg-neutral-700 rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}
