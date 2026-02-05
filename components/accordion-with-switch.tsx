import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { FC, useEffect, useRef, useState } from 'react'

interface AccordionWithSwitchProps {
  text: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

const AccordionWithSwitch: FC<AccordionWithSwitchProps> = ({
  text,
  defaultOpen = false,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen, children])

  const handleSwitchChange = (checked: boolean) => {
    setIsOpen(checked)
  }

  return (
    <div className={className}>
      <div
        className={cn(
          'flex flex-1 items-center justify-between pt-2 text-sm font-medium transition-all',
          isOpen && 'py-2'
        )}
      >
        <span className="text-left">{text}</span>
        <Switch
          checked={isOpen}
          onCheckedChange={handleSwitchChange}
          className="data-[state=checked]:bg-primary"
          aria-label={`Toggle ${text} section`}
        />
      </div>
      <div
        className="overflow-hidden text-sm transition-all duration-200 ease-in-out"
        style={{ height: `${height}px` }}
        data-state={isOpen ? 'open' : 'closed'}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  )
}

export default AccordionWithSwitch
