'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/*
  Select від shadcn (на Radix), але одягнений у токени цього проєкту, а не в
  типові змінні shadcn (--border, --popover, --accent). Їх тут немає: дизайн-
  система живе на власних --color-ink / --color-flax / --color-paper, і
  тягнути поруч другий набір змінних означало б два джерела правди про колір.

  Тому й `shadcn init` не запускався: він переписує globals.css під свої
  змінні. У components.json стоїть cssVariables: false — наступний
  `shadcn add` теж туди не полізе.

  Тригер навмисно повторює клас .field, щоб селект стояв в одному рядку з
  полями вводу й не відрізнявся від них ні рамкою, ні висотою.
*/

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger
    className={cn(
      'field flex items-center justify-between gap-2 text-left',
      'data-[placeholder]:text-muted disabled:cursor-not-allowed disabled:opacity-50',
      'focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)

const SelectScrollButton = ({
  direction,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton> & { direction: 'up' | 'down' }) => {
  const Primitive =
    direction === 'up' ? SelectPrimitive.ScrollUpButton : SelectPrimitive.ScrollDownButton
  const Icon = direction === 'up' ? ChevronUp : ChevronDown
  return (
    <Primitive className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}>
      <Icon className="size-4 text-muted" />
    </Primitive>
  )
}

const SelectContent = ({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      position={position}
      className={cn(
        'relative z-70 max-h-80 min-w-[8rem] overflow-hidden border border-ink/16 bg-paper',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        className,
      )}
      {...props}
    >
      <SelectScrollButton direction="up" />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollButton direction="down" />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

const SelectLabel = ({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) => (
  <SelectPrimitive.Label
    className={cn(
      'px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted',
      className,
    )}
    {...props}
  />
)

const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center gap-2 py-2 pl-3 pr-8 text-sm text-ink outline-none',
      'data-[highlighted]:bg-paper-deep data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5 text-ink" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
)

const SelectSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) => (
  <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-ink/16', className)} {...props} />
)

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
