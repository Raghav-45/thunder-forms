"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  // Get the current value prop of the parent AccordionItem
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  // Check if the accordion is controlled by the Root component
  const isControlled = React.useMemo(() => {
    return props["data-state"] !== undefined
  }, [props])

  // Update the local state when the controlled state changes
  React.useEffect(() => {
    if (isControlled) {
      setIsOpen(props["data-state"] === "open")
    }
  }, [isControlled, props])

  // Handle switch toggle
  const handleSwitchChange = (checked: boolean) => {
    setIsOpen(checked)
    
    // Programmatically click the accordion trigger to change state
    if (triggerRef.current && checked !== isOpen) {
      triggerRef.current.click()
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
          "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all text-left",
          className
        )}
        {...props}
        onClick={(e) => {
          // Don't propagate the click event if it comes from the Switch
          if ((e.target as HTMLElement).closest('.switch-control')) {
            e.stopPropagation()
            return
          }
          
          // Otherwise, update our state and call the original onClick if provided
          setIsOpen(!isOpen)
          if (props.onClick) props.onClick(e)
        }}
      >
        {children}
        <div 
          className="switch-control" 
          onClick={(e) => {
            // Stop propagation to prevent the accordion from toggling twice
            e.stopPropagation()
          }}
        >
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
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }