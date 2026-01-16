'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function AuthTest() {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-8 space-y-4">
      <p className="text-sm text-neutral-500">Тест модалки в изоляции</p>

      <div className="flex gap-2">
        {/* Открытие через Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button">Открыть (Trigger)</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Trigger OK</DialogTitle></DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Открытие через state */}
        <Button type="button" onClick={() => setOpen(true)}>Открыть (State)</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[9999]">
          <DialogHeader><DialogTitle>State OK</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
