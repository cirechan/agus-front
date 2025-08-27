"use client"
import * as React from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FormDialogProps {
  title: string
  trigger: React.ReactNode
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
}

export function FormDialog({ title, trigger, action, children }: FormDialogProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            await action(formData)
            setOpen(false)
          }}
          className="space-y-2"
        >
          {children}
        </form>
      </DialogContent>
    </Dialog>
  )
}
