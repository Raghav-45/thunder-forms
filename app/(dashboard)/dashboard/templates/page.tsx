'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  FormTemplate,
  TemplateCategory,
} from '@/lib/templates'
import {
  ArrowRightIcon,
  LayoutTemplateIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function TemplatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | 'All'
  >('All')

  const filtered = useMemo(() => {
    let results = TEMPLATES
    if (activeCategory !== 'All') {
      results = results.filter((t) => t.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
    }
    return results
  }, [search, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: TEMPLATES.length }
    for (const t of TEMPLATES) {
      counts[t.category] = (counts[t.category] || 0) + 1
    }
    return counts
  }, [])

  const handleUseTemplate = (template: FormTemplate) => {
    router.push(`/dashboard/builder/new-form?template=${template.id}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <LayoutTemplateIcon className="size-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Template Library
            </h1>
            <Badge variant="secondary" className="text-xs font-medium">
              {TEMPLATES.length} templates
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Pick a template and start collecting responses in seconds. Every
            template is fully customizable in the builder.
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === 'All' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('All')}
              className="cursor-pointer"
            >
              All
              <Badge
                variant="secondary"
                className="ml-1.5 text-[10px] px-1.5 py-0 h-4"
              >
                {categoryCounts['All']}
              </Badge>
            </Button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.name}
                variant={activeCategory === cat.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.name)}
                className="cursor-pointer"
              >
                {cat.label}
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-[10px] px-1.5 py-0 h-4"
                >
                  {categoryCounts[cat.name] || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Templates grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-lg font-medium">
              No templates found
            </p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-4 mb-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <SparklesIcon className="mx-auto mb-2 size-6 text-primary" />
          <p className="font-medium">Need something custom?</p>
          <p className="text-sm text-muted-foreground mb-3">
            Start from scratch or let AI generate a form for you.
          </p>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push('/dashboard/builder/new-form')}
          >
            Create Blank Form
            <ArrowRightIcon className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onUse,
}: {
  template: FormTemplate
  onUse: (t: FormTemplate) => void
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 cursor-pointer p-0">
      <CardContent className="flex flex-col h-full p-0">
        {/* Top color band based on category */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 to-primary/20" />

        <div className="p-4 pb-3 flex-1 flex flex-col">
          {/* Icon + category */}
          <div className="flex items-start justify-between mb-3">
            <span className="text-2xl leading-none">{template.icon}</span>
            <Badge variant="outline" className="text-[10px] font-medium">
              {template.category}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[15px] leading-snug mb-1.5">
            {template.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {template.description}
          </p>

          {/* Meta */}
          <div className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <span>{template.fieldCount} fields</span>
            <span className="inline-block size-0.5 rounded-full bg-muted-foreground/40" />
            <span>Ready to use</span>
          </div>
        </div>

        {/* Action */}
        <div className="px-4 pb-4 pt-0">
          <Button
            size="sm"
            className="w-full cursor-pointer"
            onClick={() => onUse(template)}
          >
            Use Template
            <ArrowRightIcon className="ml-1 size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
