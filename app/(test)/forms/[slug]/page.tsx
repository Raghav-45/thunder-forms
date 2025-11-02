'use client'

import { FieldConfig } from '@/components/FormBuilder/elements'
import { validateFormFields } from '@/components/FormBuilder/utils/formValidation'
import { useFormStore } from '@/components/FormBuilder/store'
import { getFieldComponent } from '@/components/FormBuilder/utils/helperFunctions'
import { FormSubmittedPage } from '@/components/FormSubmittedPage'
import { FormExpiredDialog } from '@/components/FormExpiredDialog'
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
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState<string>("Active")
  const [showClosedDialog, setShowClosedDialog] = useState(false)

  // Check if form is closed based on status
  const checkIsFormClosed = (status: string) => {
    return status.startsWith('Closed')
  }

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear any existing errors for this field when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const handleSubmit = async () => {
    const newErrors = validateFormFields(fields, formData)
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length
      const firstError = Object.values(newErrors)[0]
      if (errorCount === 1) {
        toast.error(firstError)
      } else {
        toast.error(`Please fix ${errorCount} field${errorCount > 1 ? 's' : ''} before submitting`)
      }
      return
    }

    setIsSubmitting(true)
    try {
      await axios.post(`/api/forms/${currentFormId}/submit`, {
        data: formData
      })
      setIsFormSubmitted(true)
      toast.success('Form submitted successfully!')
    } catch (error) {
      console.error('Form submission error:', error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422 && error.response?.data?.validationErrors) {
          // Handle server-side validation errors
          const serverErrors = error.response.data.validationErrors
          setErrors(serverErrors)
          const errorCount = Object.keys(serverErrors).length
          toast.error(`Server validation failed: Please fix ${errorCount} field${errorCount > 1 ? 's' : ''} and try again`)
        } else if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        } else {
          toast.error('Failed to submit form. Please try again.')
        }
      } else {
        toast.error('Failed to submit form. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FieldConfig) => {
    const FieldComponent = getFieldComponent(field.uniqueIdentifier)

    // Create a disabled version of the field config when form is closed
    const fieldConfig = checkIsFormClosed(formStatus) ? { ...field, disabled: true } as FieldConfig : field

    return (
      <div key={field.id} className="relative group">
        <div className="w-full">
          <FieldComponent
            field={fieldConfig as never}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
          />
        </div>
      </div>
    )
  }

  const form = useQuery({
    queryKey: ['form', currentFormId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/forms/${currentFormId}/viewForm`)
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
      const expiresAt = form.data.expiresAt ? new Date(form.data.expiresAt) : undefined
      
      setFormSettings({
        title: form.data.title,
        description: form.data.description,
        expiresAt,
        maxSubmissions: form.data.maxSubmissions,
        redirectUrl: form.data.redirectUrl,
      })
      setFields(form.data.fields)

      // Check if form is closed based on status from API
      const isClosed = checkIsFormClosed(form.data.status)
      setFormStatus(form.data.status)
      
      if (isClosed) {
        setShowClosedDialog(true)
      }
      
      // Initialize form data with default values
      const initialFormData: Record<string, unknown> = {}
      form.data.fields.forEach((field: FieldConfig) => {
        if (field.uniqueIdentifier === 'switch-field') {
          const switchField = field as { defaultValue?: boolean }
          initialFormData[field.id] = switchField.defaultValue || false
        } else if (field.uniqueIdentifier === 'multi-select') {
          initialFormData[field.id] = []
        } else {
          initialFormData[field.id] = ''
        }
      })
      setFormData(initialFormData)
      
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
      <Button
        className="w-full md:w-auto"
        onClick={handleSubmit}
        disabled={isSubmitting || checkIsFormClosed(formStatus)}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
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
