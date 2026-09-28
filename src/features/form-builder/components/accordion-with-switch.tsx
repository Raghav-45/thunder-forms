import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { FC, useState } from 'react'

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
        className={cn(
          'grid text-sm transition-[grid-template-rows] duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        data-state={isOpen ? 'open' : 'closed'}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

export default AccordionWithSwitch
