'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  countTemplateFields,
  type FormTemplateSpec,
} from '@/lib/form-templates'
import { ArrowRightIcon, EyeIcon, FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { FORM_TEMPLATES } from '../constants'

function TemplateCard({ template }: { template: FormTemplateSpec }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const fieldCount = countTemplateFields(template)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{template.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {fieldCount} field{fieldCount !== 1 ? 's' : ''}
          </span>
        </div>
        <CardTitle className="mt-2">{template.title}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-1.5">
          {template.sections
            .flatMap((section) => section.fields)
            .slice(0, 4)
            .map((field, index) => (
              <li
                key={`${field.type}-${index}`}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <FileTextIcon className="size-3.5 shrink-0" />
                <span className="truncate">{field.label}</span>
              </li>
            ))}
        </ul>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 cursor-pointer"
          onClick={() => setPreviewOpen(true)}
        >
          <EyeIcon className="mr-1 size-4" />
          Preview
        </Button>
        <Button size="sm" className="flex-1 cursor-pointer" asChild>
          <Link href={`/dashboard/testing-v3?template=${template.slug}`}>
            Use template
            <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        </Button>
      </CardFooter>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template.title}</DialogTitle>
            <DialogDescription>{template.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {template.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                {template.sections.length > 1 && (
                  <p className="text-sm font-medium">
                    Section {sectionIndex + 1}
                  </p>
                )}
                <ul className="space-y-2">
                  {section.fields.map((field, fieldIndex) => (
                    <li
                      key={`${field.type}-${fieldIndex}`}
                      className="flex items-start justify-between gap-2 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {field.label}
                          {field.required && (
                            <span className="ml-1 text-destructive">*</span>
                          )}
                        </p>
                        {field.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {field.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
            <Button className="cursor-pointer" asChild>
              <Link href={`/dashboard/testing-v3?template=${template.slug}`}>
                Use this template
                <ArrowRightIcon className="ml-1 size-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function TemplateGallery({ compact = false }: { compact?: boolean }) {
  const templates = compact ? FORM_TEMPLATES.slice(0, 4) : FORM_TEMPLATES

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {templates.map((template) => (
        <TemplateCard key={template.slug} template={template} />
      ))}
    </div>
  )
}
