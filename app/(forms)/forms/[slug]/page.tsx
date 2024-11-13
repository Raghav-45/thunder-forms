'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { db } from '@/config/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { FormElementPreview } from '@/components/FormElementPreview'

// interface FormElement {
//   id: string
//   type: string
//   label: string
// }

// interface FormElementType {
//   id: string // Unique identifier for the element
//   type:
//     | 'text'
//     | 'number'
//     | 'email'
//     | 'checkbox'
//     | 'radio'
//     | 'select'
//     | 'textarea'
//   label: string // Label to display for the element
//   placeholder?: string // Placeholder text (for text inputs, textarea, etc.)
//   options?: string[] // Array of options (for checkbox, radio, select types)
//   isRequired: boolean // Indicates if the element is required
// }

interface PageProps {
  params: {
    slug: string
  }
}

export default function Page({ params }: PageProps) {
  const [formData, setFormData] = useState<FormType>()
  const [loading, setLoading] = useState(true)
  const { slug } = params

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'forms', slug))
        if (docSnap.exists()) {
          setFormData(docSnap.data() as FormType)
        } else {
          console.log('No such document!')
        }
      } catch (error) {
        console.error('Error fetching document:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  if (loading) return <p>Loading...</p>
  return (
    <div className="md:container space-y-6 p-10 pb-16">
      <div className="space-y-0.5 md:space-y-1">
        <h2 className="text-2xl md:text-5xl font-bold tracking-tight">
          {formData && formData.name}
        </h2>
        <p className="text-muted-foreground">
          {formData?.description ?? 'What area are you having problems with?'}
        </p>
      </div>
      <div className="space-y-4">
        {formData &&
          formData?.fields.length > 0 &&
          formData.fields.map((element) => (
            <FormElementPreview
              key={element.id}
              type={element.type}
              label={element.label}
            />
          ))}
        <div className="justify-between space-x-2 mt-8">
          <Button variant="ghost">Cancel</Button>
          <Button>Submit</Button>
        </div>
      </div>
    </div>
  )
}
