'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={className} {...props} />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    onSwitchChange?: (checked: boolean) => void
  }
>(({ className, children, onSwitchChange, ...props }, ref) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  // Handle switch toggle
  const handleSwitchChange = (checked: boolean) => {
    setIsOpen(checked)
    if (onSwitchChange) {
      onSwitchChange(checked)
    }

    // Programmatically click the accordion trigger to change state
    if (triggerRef.current && checked !== isOpen) {
      // Create and dispatch a custom event
      const customEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
      triggerRef.current.dispatchEvent(customEvent)
    }
  }

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={(node) => {
          // This handles both the ref we receive and our local ref
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
          triggerRef.current = node
        }}
        className={cn(
          'flex flex-1 items-center justify-between py-2 text-sm font-medium transition-all text-left',
          className
        )}
        {...props}
        onClick={(e) => {
          // Prevent default trigger behavior for all clicks except our programmatic ones
          if (!e.isTrusted) {
            // This is our programmatic click, let it proceed
            if (props.onClick) props.onClick(e)
          } else {
            // This is a real user click, prevent accordion toggling
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {children}
        <div className="switch-control">
          <Switch
            checked={isOpen}
            onCheckedChange={handleSwitchChange}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      className
    )}
    {...props}
  >
    <div className={cn('py-px', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
