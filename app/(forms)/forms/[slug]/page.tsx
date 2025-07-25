'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FormFieldOrGroup } from '@/types/types'
import { FormPreview } from '@/components/form-preview'
import SkeletonPage from '../skeleton/page'
import FormSubmissionPage from '@/components/FormSubmittedPage'

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

  const [formRedirectUrl, setFormRedirectUrl] = useState<null | string>(null)
  const [formFields, setFormFields] = useState<FormFieldOrGroup[]>([])

  const [loading, setLoading] = useState(true)
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const { slug } = params

  useEffect(() => {
    fetch(`/api/forms/${slug}`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.fields) {
          setFormFields(data.fields)
          setFormName(data.title || 'New form')
          setFormDescription(data.description || 'Lorem ipsum dolor sit amet')
          setFormRedirectUrl(data.redirectUrl || null)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching form data from API:', error)
        toast.error('Error loading form data from API')
      })
  }, [slug]) // Only depends on slug

  if (loading) return <SkeletonPage />
  if (isFormSubmitted) {
    return <FormSubmissionPage redirectUrl={formRedirectUrl} />
  } else {
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
              <FormPreview
                formFields={formFields}
                behaveAsPreview={true}
                formId={slug}
                afterSubmitted={() => {
                  setIsFormSubmitted(true)
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
}
