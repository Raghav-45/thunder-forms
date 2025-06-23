import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { FC, useState } from 'react'

interface AccordionWithSwitchProps {
  text: string
  defaultOpen: boolean
  children: React.ReactNode
}

const AccordionWithSwitch: FC<AccordionWithSwitchProps> = ({
  text,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const handleSwitchChange = (checked: boolean) => {
    setIsOpen(checked)
  }
  return (
    <div>
      <div className="flex flex-1 items-center justify-between py-2 text-sm font-medium transition-all text-left">
        <p>{text}</p>
        <Switch
          checked={isOpen}
          onCheckedChange={handleSwitchChange}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      <div
        className={cn(
          'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
          isOpen ? 'h-10' : 'h-0'
        )}
      >
        <div className="py-px">{children}</div>
      </div>
    </div>
  )
}

export default AccordionWithSwitch
