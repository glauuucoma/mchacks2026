import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      animation: {
        none: "",
        scale: "active:scale-95 hover:scale-105",
        "fill-in": "relative overflow-hidden group",
        underline: "relative group",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  animation = "none",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  const baseClasses = buttonVariants({ variant, size, animation, className })

  // Fill-in animation needs specific background color based on variant
  const getFillColor = () => {
    if (variant === "default") return "bg-primary/90"
    if (variant === "destructive") return "bg-destructive/90"
    if (variant === "secondary") return "bg-secondary/80"
    if (variant === "outline") return "bg-accent"
    return "bg-accent"
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-animation={animation}
      className={baseClasses}
      {...props}
    >
      {animation === "fill-in" ? (
        <>
          <span className="relative z-10">{children}</span>
          <span className={`absolute inset-0 ${getFillColor()} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
        </>
      ) : animation === "underline" ? (
        <>
          {children}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
