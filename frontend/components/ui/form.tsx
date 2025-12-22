'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

const FormContext = React.createContext<any>({})

const FormField = ({ control, name, render }: any) => {
  const formContext = React.useContext(FormContext);

  // Use the control from props or from context
  const formControl = control || formContext?.control;

  if (formControl) {
    return render({
      field: {
        name,
        value: formControl._formValues?.[name] || '',
        onChange: (value: any) => {
          if (formControl._formValues) {
            formControl._formValues[name] = value;
            // Trigger form state update if available
            if (formControl._subjects?.state) {
              formControl._subjects.state.next(formControl._formValues);
            }
          }
        },
        onBlur: () => {
          if (formControl._subjects?.state) {
            formControl._subjects.state.next(formControl._formValues);
          }
        },
      },
    });
  }

  // Fallback
  return render({
    field: {
      name,
      value: '',
      onChange: () => {},
      onBlur: () => {},
    },
  });
}

const Form = ({ children, className, ...props }: any) => {
  // Separate React Hook Form props from DOM props
  const { control, ...domProps } = props;

  // Extract className from DOM props
  const { className: originalClassName, ...finalDomProps } = domProps;

  // Combine className with existing form className if any
  const formClassName = cn(originalClassName, className);

  return (
    <FormContext.Provider value={props}>
      <form className={formClassName} {...finalDomProps}>{children}</form>
    </FormContext.Provider>
  )
}

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return <div ref={ref} {...props} />
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  if (!children) return null
  
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
