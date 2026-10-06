import {
  Briefcase,
  ClipboardList,
  FileText,
  LayoutGrid,
  LifeBuoy,
  type LucideIcon,
  Mail,
  Settings2,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import {
  type FC,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import { Icons } from '#/components/Icons'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Separator } from '#/components/ui/separator'
import { ShineBorder } from '#/components/ui/shine-border'
import {
  countTemplateFields,
  FORM_TEMPLATES,
} from '#/containers/dashboard/templates/constants'
// NOTE (older look restored): the custom CSS-module entry button below is
// parked but preserved. To bring it back, uncomment the styles import and the
// commented trigger block, and remove the shadcn Button trigger.
// import styles from "#/features/form-builder/core/generate-with-ai.module.css";
import {
  type GeneratedForm,
  GeneratedFormResponseValidator,
} from '#/features/form-builder/core/generated-form'

// Generate With AI dialog: Tailwind utilities throughout. Animation tokens
// (--animate-ag-*), @property hooks, and the Firefox scrollbar rule live in
// src/styles.css. (The co-located generate-with-ai.module.css entry button is
// currently parked in a comment below; see NOTE there.)

interface GenerateWithAiPromptProps {
  onGeneratedForm: (form: GeneratedForm) => void
}

type Panel = 'suggested' | 'templates' | 'options'
type Phase = 'idle' | 'building'

interface Choice {
  category: string
  description: string
  fields: string
  id: string
  icon: LucideIcon
  prompt: string
  title: string
}

const SUGGESTIONS: Choice[] = [
  {
    category: 'business',
    description: 'Name, email, subject, message',
    fields: '4 fields',
    icon: Mail,
    id: 'contact',
    prompt: 'A contact form with name, email, subject and message',
    title: 'Contact form',
  },
  {
    category: 'hr',
    description: 'Resume upload, experience, cover letter',
    fields: '8 fields',
    icon: Briefcase,
    id: 'job',
    prompt: 'A job application form with resume upload and cover letter',
    title: 'Job application',
  },
  {
    category: 'events',
    description: 'Tickets, attendees, dietary needs',
    fields: '7 fields',
    icon: Ticket,
    id: 'event',
    prompt: 'An event registration form with ticket types and dietary needs',
    title: 'Event registration',
  },
  {
    category: 'surveys',
    description: 'Rating, NPS, comments',
    fields: '5 fields',
    icon: Star,
    id: 'feedback',
    prompt: 'A customer feedback survey with rating and NPS',
    title: 'Feedback survey',
  },
]

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  Application: Briefcase,
  Contact: Mail,
  Event: Ticket,
  Feedback: Star,
  Support: LifeBuoy,
  Survey: ClipboardList,
}

const TEMPLATES: Choice[] = FORM_TEMPLATES.map((template) => ({
  category: template.category,
  description: template.description,
  fields: `${countTemplateFields(template)} fields`,
  icon: TEMPLATE_ICONS[template.category] ?? FileText,
  id: template.slug,
  prompt: `Use the ${template.title} template (slug: ${template.slug}) without modifications.`,
  title: template.title,
}))

const TEMPLATE_CATEGORIES = [
  'All',
  ...new Set(TEMPLATES.map((template) => template.category)),
]

const PLACEHOLDERS = [
  'A contact form with name, email and message…',
  'A yoga studio signup with a waiver checkbox…',
  'A job application with resume upload…',
  'A customer feedback survey with NPS…',
]

const BUILD_STEPS = [
  'Understanding your prompt…',
  'Choosing field types…',
  'Adding validation…',
  'Laying out your form…',
]

const PANEL_ORDER: Panel[] = ['suggested', 'templates', 'options']

const PANELS: { id: Panel; label: string; icon: LucideIcon }[] = [
  { id: 'suggested', label: 'Suggested', icon: Sparkles },
  { id: 'templates', label: 'Templates', icon: LayoutGrid },
  { id: 'options', label: 'Options', icon: Settings2 },
]

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to generate form'
}

/**
 * Tracks the rendered height of an element via ResizeObserver.
 *
 * Uses layout sizes (offsetHeight / borderBoxSize), which ignore CSS
 * transforms, so the dialog's open "zoom" animation can't skew the value.
 * Returns a callback ref (the Dialog content mounts lazily, so a plain
 * useRef + useEffect would run before the node exists).
 */
function useMeasuredHeight() {
  const [height, setHeight] = useState<number | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!node) {
      setHeight(null)
      return
    }
    setHeight(node.offsetHeight)
    const observer = new ResizeObserver(([entry]) => {
      setHeight(
        Math.ceil(
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height,
        ),
      )
    })
    observer.observe(node)
    observerRef.current = observer
  }, [])

  return [ref, height] as const
}

// Animation tokens (--animate-ag-*) live in src/styles.css (@theme, next to
// the shine precedent); @property + Firefox scrollbar hook appended there.
// Everything else on the elements below is Tailwind utilities.

const GenerateWithAiPrompt: FC<GenerateWithAiPromptProps> = ({
  onGeneratedForm,
}) => {
  const [activePanel, setActivePanel] = useState<Panel>('suggested')
  const [buildStep, setBuildStep] = useState(0)
  const [category, setCategory] = useState('All')
  const [formLength, setFormLength] = useState('Standard')
  const [formType, setFormType] = useState('Form')
  const [isOpen, setIsOpen] = useState(false)
  const [panelDirection, setPanelDirection] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [placeholder, setPlaceholder] = useState(
    'Describe the form you want to build…',
  )
  const [prompt, setPrompt] = useState('')
  const [promptError, setPromptError] = useState<string | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [bodyRef, bodyHeight] = useMeasuredHeight()
  // Pin the dialog top on mount: it starts centered, then stays fixed so
  // tab switches (and errors) only move the bottom edge. A callback ref
  // (not an effect + querySelector) guarantees the dialog node exists.
  const pinTopRef = useCallback(
    (node: HTMLDivElement | null) => {
      bodyRef(node)
      if (!node) return
      const dialog = node.closest<HTMLElement>('[data-ai-generation-dialog]')
      if (dialog) {
        dialog.style.top = `${Math.max(0, (window.innerHeight - dialog.offsetHeight) / 2)}px`
      }
    },
    [bodyRef],
  )
  const abortRef = useRef<AbortController | null>(null)
  const promptId = useId()
  const errorId = `${promptId}-error`
  const isBuilding = phase === 'building'
  const shouldReduceMotion = useReducedMotion()
  const visibleTemplates = TEMPLATES.filter(
    (template) => category === 'All' || template.category === category,
  )

  const panelTransitionVariants: Variants = {
    initial: (direction: number) =>
      shouldReduceMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            x: direction > 0 ? 80 : direction < 0 ? -80 : 0,
            scale: 0.98,
            filter: 'blur(8px)',
          },
    animate: shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
    exit: (direction: number) =>
      shouldReduceMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            x: direction > 0 ? -80 : direction < 0 ? 80 : 0,
            scale: 0.98,
            filter: 'blur(8px)',
          },
  }
  // Shared by the pane slide AND the container height so they move as one.
  const panelTransition: Transition = shouldReduceMotion
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }
  const overlayTransition: Transition = shouldReduceMotion
    ? { duration: 0.15 }
    : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
  const overlayVariants: Variants = {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.985, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.99, filter: 'blur(2px)' },
  }

  // Typewriter placeholder
  useEffect(() => {
    if (!isOpen || prompt || phase !== 'idle') return
    let wordIndex = 0
    let characterIndex = 0
    let deleting = false
    let timeout: ReturnType<typeof setTimeout>
    const type = () => {
      const word = PLACEHOLDERS[wordIndex]
      characterIndex += deleting ? -1 : 1
      setPlaceholder(word.slice(0, characterIndex) || '​')
      let delay = deleting ? 36 : 58
      if (!deleting && characterIndex === word.length) {
        deleting = true
        delay = 1800
      } else if (deleting && characterIndex === 0) {
        deleting = false
        wordIndex = (wordIndex + 1) % PLACEHOLDERS.length
        delay = 350
      }
      timeout = setTimeout(type, delay)
    }
    timeout = setTimeout(type, 350)
    return () => clearTimeout(timeout)
  }, [isOpen, phase, prompt])

  // Cycle the status text while building
  useEffect(() => {
    if (!isBuilding) {
      setBuildStep(0)
      return
    }
    const id = setInterval(
      () => setBuildStep((step) => Math.min(step + 1, BUILD_STEPS.length - 1)),
      1400,
    )
    return () => clearInterval(id)
  }, [isBuilding])

  // Abort any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  function reset() {
    setPhase('idle')
    setPrompt('')
    setPromptError(null)
    setSelectedChoice(null)
    setFormLength('Standard')
    setFormType('Form')
  }

  function selectChoice(choice: Choice) {
    setPrompt(choice.prompt)
    setSelectedChoice(choice.id)
    setPromptError(null)
  }

  function selectPanel(panel: Panel) {
    if (panel === activePanel) return
    setPanelDirection(
      PANEL_ORDER.indexOf(panel) > PANEL_ORDER.indexOf(activePanel) ? 1 : -1,
    )
    setActivePanel(panel)
  }

  // Sliding tab indicator: measured button geometry (offsetLeft/offsetWidth
  // already include container padding and gaps), glided with a CSS
  // transition. Measured from a callback ref on the tab row itself: Radix
  // mounts the dialog content a commit after isOpen flips, so an effect
  // alone would miss the buttons on open. Re-measured on tab change and
  // window resize.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const modesRef = useRef<HTMLDivElement | null>(null)
  const measurePill = useCallback(() => {
    const selected = modesRef.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    )
    if (!selected) return
    const next = { left: selected.offsetLeft, width: selected.offsetWidth }
    setPill((previous) =>
      previous && previous.left === next.left && previous.width === next.width
        ? previous
        : next,
    )
  }, [])
  const modesRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      modesRef.current = node
      if (node) measurePill()
    },
    [measurePill],
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: Remeasure the mounted DOM when the selected tab or dialog visibility changes.
  useLayoutEffect(() => {
    measurePill()
    window.addEventListener('resize', measurePill)
    return () => window.removeEventListener('resize', measurePill)
  }, [activePanel, isOpen, measurePill])

  async function generate() {
    if (isBuilding) return
    const trimmed = prompt.trim()
    if (!trimmed) {
      setPromptError(
        'Describe the form you want to create before generating it.',
      )
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setPhase('building')
    setPromptError(null)
    try {
      // Templates keep their configured questions. Optional preferences must
      // not override the user's explicit requirements or expand basic requests.
      const preferences = /\btemplates?\b/i.test(trimmed)
        ? []
        : [
            formType === 'Survey' ? 'Use a survey format.' : null,
            formLength !== 'Standard'
              ? `Use a ${formLength.toLowerCase()} level of detail.`
              : null,
          ].filter(Boolean)
      const generationPrompt = preferences.length
        ? `${trimmed}\n\nOptional generation preferences (only when the request does not already specify the type, length, or field count):\n${preferences.join('\n')}`
        : trimmed
      const response = await fetch('/api/generatewithai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: generationPrompt,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: unknown
        } | null
        throw new Error(
          typeof body?.error === 'string' && body.error
            ? body.error
            : 'Failed to generate form',
        )
      }
      const data = GeneratedFormResponseValidator.safeParse(
        await response.json(),
      )
      if (controller.signal.aborted) return
      if (!data.success) {
        throw new Error('AI returned an invalid form structure')
      }
      // Built: apply straight into the builder and close. No interstitial.
      onGeneratedForm(data.data)
      setIsOpen(false)
      reset()
    } catch (error) {
      // Closed or restarted while in flight: nothing to report.
      if (controller.signal.aborted) return
      setPhase('idle')
      setPromptError(errorMessage(error))
      toast.error(errorMessage(error))
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          abortRef.current?.abort()
          reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="relative w-full cursor-pointer" variant="secondary">
          <ShineBorder
            shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']}
            className="rounded-md"
          />
          <Icons.Sparkles className="size-4 fill-white" />
          Generate with AI
        </Button>
      </DialogTrigger>
      {/* NOTE (older look restored): custom glow/particle entry button parked
		    below — kept so the new code isn't lost. To re-enable it, uncomment
		    the styles import at the top, uncomment this block, and remove the
		    shadcn Button trigger above. Its styles live in
		    generate-with-ai.module.css (kept as-is; unimported CSS ships
		    nothing until the import returns).
		<span className={styles.wrap}>
			<DialogTrigger asChild>
				<button type="button" className={styles.btn}>
					<svg
						className={`${styles.st} ${styles.a}`}
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<use href="#gs-star" />
					</svg>
					<svg
						className={`${styles.st} ${styles.b}`}
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<use href="#gs-star" />
					</svg>
					<svg
						className={`${styles.st} ${styles.c}`}
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<use href="#gs-star" />
					</svg>
					<span className={styles.label}>Generate with AI</span>
				</button>
			</DialogTrigger>
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<i className={styles.p} aria-hidden="true" />
			<span className={`${styles.tw} ${styles.tw1}`} aria-hidden="true" />
			<span className={`${styles.tw} ${styles.tw2}`} aria-hidden="true" />
			<span className={`${styles.tw} ${styles.tw3}`} aria-hidden="true" />
			<svg
				width="0"
				height="0"
				style={{ position: "absolute" }}
				aria-hidden="true"
			>
				<defs>
					<path
						id="gs-star"
						d="M12 0C12.7 6.6 17.4 11.3 24 12 17.4 12.7 12.7 17.4 12 24 11.3 17.4 6.6 12.7 0 12 6.6 11.3 11.3 6.6 12 0Z"
					/>
				</defs>
			</svg>
		</span>
		*/}
      {/* Centered on open, then top-pinned (see effect above): the prompt
			    bar and tabs never move, the dialog only grows/shrinks downward. */}
      <DialogContent
        data-ai-generation-dialog
        showCloseButton={false}
        className="!grid !translate-y-0 origin-center gap-0 overflow-hidden rounded-xl border border-border bg-background p-0 text-foreground data-[state=open]:animate-none! data-[state=open]:transition-none! sm:max-w-[680px]"
        overlayClassName="bg-black/65 backdrop-blur-[7px] data-[state=open]:animate-none! data-[state=open]:transition-none!"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Generate with AI</DialogTitle>
          <DialogDescription>Generate a form with AI.</DialogDescription>
        </DialogHeader>

        {/* Prompt row: 2px animated border wrapper, 48px tall inner row */}
        <div className="mx-4 mt-4 rounded-lg bg-border p-0.5 transition-[background] duration-200 focus-within:bg-[conic-gradient(from_var(--ag-angle),var(--primary),var(--accent),var(--primary))] focus-within:animate-ag-rotate motion-reduce:transition-none motion-reduce:focus-within:animate-none">
          <div className="flex h-12 items-center gap-3 rounded-md bg-background px-4">
            <Sparkles
              aria-hidden="true"
              className="size-5 flex-none animate-ag-pulse text-primary motion-reduce:animate-none"
            />
            <input
              aria-describedby={promptError ? errorId : undefined}
              aria-invalid={Boolean(promptError)}
              aria-label="Describe the form you want to build"
              className="h-6 min-w-0 flex-1 border-0 bg-transparent text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground placeholder:opacity-100"
              disabled={isBuilding}
              id={promptId}
              placeholder={
                prompt ? 'Describe the form you want to build…' : placeholder
              }
              value={prompt}
              onChange={(event) => {
                const value = event.target.value
                setPrompt(value)
                setPromptError(null)
                // Un-highlight the card once the text no longer matches it
                setSelectedChoice((current) => {
                  const choice = [...SUGGESTIONS, ...TEMPLATES].find(
                    (t) => t.id === current,
                  )
                  return choice && choice.prompt === value ? current : null
                })
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  generate()
                }
              }}
            />
            <kbd className="inline-flex h-5 min-w-5 flex-none items-center justify-center rounded border border-border bg-muted px-1.5 font-medium text-xs leading-none text-muted-foreground">
              esc
            </kbd>
          </div>
        </div>

        {/* Mode tabs: p-1 + h-8 buttons = 40px */}
        <div
          className="relative mx-4 mt-3 flex w-max max-w-[calc(100%-2rem)] gap-1 rounded-lg border border-border bg-muted p-1"
          role="tablist"
          aria-label="Generation modes"
          ref={modesRefCallback}
        >
          {PANELS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="h-8 rounded-md border-0 bg-transparent px-3 font-medium text-sm leading-5 text-muted-foreground transition-[color] duration-200 aria-[selected=true]:text-foreground hover:text-foreground motion-reduce:transition-none"
              role="tab"
              aria-selected={activePanel === id}
              onClick={() => selectPanel(id)}
              type="button"
            >
              <span className="relative z-[1] inline-flex items-center gap-2">
                <Icon className="size-4 flex-none" aria-hidden="true" />
                {label}
              </span>
            </button>
          ))}
          {pill && (
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-md bg-background shadow-sm ring-1 ring-border transition-[left,width] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
              style={{ left: pill.left, width: pill.width }}
            />
          )}
        </div>

        {/* Animated-height wrapper: it follows the measured height of the body */}
        <motion.div
          animate={{ height: bodyHeight ?? 'auto' }}
          className="relative overflow-hidden"
          initial={false}
          transition={panelTransition}
        >
          {/* px-3 here + p-1 on the pane = 16px, matching the dialog gutter */}
          <div className="relative min-h-72 px-3 py-3" ref={pinTopRef}>
            <AnimatePresence
              custom={panelDirection}
              initial={false}
              mode="popLayout"
            >
              <motion.div
                animate="animate"
                className="ag-scrollpane max-h-[clamp(180px,calc(100dvh-320px),420px)] overflow-x-hidden overflow-y-auto overscroll-contain p-1 will-change-[transform,opacity,filter]"
                custom={panelDirection}
                exit="exit"
                initial="initial"
                key={activePanel}
                transition={panelTransition}
                variants={panelTransitionVariants}
              >
                {activePanel === 'suggested' && (
                  <div className="flex flex-col gap-1">
                    {SUGGESTIONS.map((choice) => (
                      <button
                        className="group flex w-full items-center gap-3 rounded-md border border-transparent bg-transparent px-3 py-2 text-left transition-[background-color_.22s_ease,border-color_.22s_ease] aria-[pressed=true]:border-primary aria-[pressed=true]:bg-muted hover:bg-muted motion-reduce:transition-none"
                        key={choice.id}
                        aria-pressed={selectedChoice === choice.id}
                        disabled={isBuilding}
                        onClick={() => selectChoice(choice)}
                        type="button"
                      >
                        <span className="grid size-8 flex-none place-items-center rounded-md bg-primary/15 text-primary">
                          <choice.icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-sm leading-5 text-foreground">
                            {choice.title}
                          </span>
                          <span className="block text-xs leading-4 text-muted-foreground">
                            {choice.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activePanel === 'templates' && (
                  <div>
                    <div className="mb-3 flex gap-1 overflow-x-auto">
                      {TEMPLATE_CATEGORIES.map((value) => (
                        <button
                          className="h-8 flex-none rounded-md border-0 bg-transparent px-3 font-medium text-sm leading-5 text-muted-foreground aria-[pressed=true]:bg-muted aria-[pressed=true]:text-foreground hover:text-foreground"
                          key={value}
                          aria-pressed={category === value}
                          onClick={() => setCategory(value)}
                          type="button"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-3">
                      {visibleTemplates.map((choice) => (
                        <button
                          className="group flex min-h-36 flex-col items-start rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-[border-color_.22s_ease] aria-[pressed=true]:border-primary hover:border-primary motion-reduce:transition-none"
                          key={choice.id}
                          aria-pressed={selectedChoice === choice.id}
                          disabled={isBuilding}
                          onClick={() => selectChoice(choice)}
                          type="button"
                        >
                          <span className="grid size-8 flex-none place-items-center rounded-md bg-primary/15 text-primary">
                            <choice.icon
                              className="size-4"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="mt-3 block font-medium text-sm leading-5">
                            {choice.title}
                          </span>
                          <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                            {choice.description}
                          </span>
                          <span className="mt-auto inline-flex h-5 items-center rounded-full border border-border px-2 text-xs leading-none text-muted-foreground">
                            {choice.fields}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activePanel === 'options' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-[background-color_.15s] hover:bg-muted motion-reduce:transition-none">
                      <span className="min-w-0">
                        <span className="block font-medium text-sm leading-5 text-foreground">
                          Type
                        </span>
                        <span className="block text-xs leading-4 text-muted-foreground">
                          What kind of form to generate
                        </span>
                      </span>
                      <div className="inline-flex flex-none gap-1 rounded-lg border border-border bg-muted p-1">
                        {['Form', 'Survey'].map((value) => (
                          <button
                            className="h-8 rounded-md border-0 bg-transparent px-3 font-medium text-sm leading-5 text-muted-foreground aria-[pressed=true]:bg-background aria-[pressed=true]:text-foreground aria-[pressed=true]:shadow-sm"
                            key={value}
                            aria-pressed={formType === value}
                            onClick={() => setFormType(value)}
                            type="button"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-[background-color_.15s] hover:bg-muted motion-reduce:transition-none">
                      <span className="min-w-0">
                        <span className="block font-medium text-sm leading-5 text-foreground">
                          Length
                        </span>
                        <span className="block text-xs leading-4 text-muted-foreground">
                          How many fields to include
                        </span>
                      </span>
                      <div className="inline-flex flex-none gap-1 rounded-lg border border-border bg-muted p-1">
                        {['Short', 'Standard', 'Detailed'].map((value) => (
                          <button
                            className="h-8 rounded-md border-0 bg-transparent px-3 font-medium text-sm leading-5 text-muted-foreground aria-[pressed=true]:bg-background aria-[pressed=true]:text-foreground aria-[pressed=true]:shadow-sm"
                            key={value}
                            aria-pressed={formLength === value}
                            onClick={() => setFormLength(value)}
                            type="button"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {promptError && (
              <p
                className="mt-2 px-1 text-sm leading-5 text-destructive"
                id={errorId}
                role="alert"
              >
                {promptError}
              </p>
            )}
          </div>
        </motion.div>

        {/* Footer: 16px gutters both sides, hints and kbd share text-xs */}
        <div className="flex flex-col">
          <Separator />
          <div className="flex items-center gap-4 px-4 py-3 text-xs leading-4 text-muted-foreground">
            <span className="inline-flex items-center gap-2 max-[520px]:hidden">
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-medium text-xs leading-none text-muted-foreground">
                ↵
              </kbd>
              generate
            </span>
            <span className="max-[520px]:hidden">
              AI can make mistakes. Everything stays editable.
            </span>
            <Button
              className="ml-auto h-10 px-4 text-sm"
              disabled={isBuilding || !prompt.trim()}
              onClick={generate}
            >
              Generate
            </Button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {phase === 'building' && (
            <motion.div
              animate="animate"
              className="absolute inset-0 flex flex-col overflow-hidden bg-background p-6"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                background: 'var(--background)',
              }}
              exit="exit"
              initial="initial"
              key="building"
              transition={overlayTransition}
              variants={overlayVariants}
            >
              <div className="flex items-center gap-3 font-medium text-sm leading-5">
                <span className="size-4 flex-none animate-ag-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none" />
                {BUILD_STEPS[buildStep]}
              </div>
              <div className="my-4 h-1 overflow-hidden rounded-full bg-muted">
                <i className="block h-full w-[72%] animate-ag-shim bg-[linear-gradient(90deg,var(--primary),var(--accent))] motion-reduce:animate-none" />
              </div>
              <div className="grid gap-4">
                <div className="h-10 animate-ag-shim rounded-md border border-border bg-[linear-gradient(90deg,var(--muted)_25%,var(--border)_50%,var(--muted)_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
                <div className="h-10 animate-ag-shim rounded-md border border-border bg-[linear-gradient(90deg,var(--muted)_25%,var(--border)_50%,var(--muted)_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
                <div className="h-10 animate-ag-shim rounded-md border border-border bg-[linear-gradient(90deg,var(--muted)_25%,var(--border)_50%,var(--muted)_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
                <div className="h-20 animate-ag-shim rounded-md border border-border bg-[linear-gradient(90deg,var(--muted)_25%,var(--border)_50%,var(--muted)_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default GenerateWithAiPrompt
