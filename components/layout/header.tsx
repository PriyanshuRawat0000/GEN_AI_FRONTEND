"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Header({
  email,
  onLogout,
}: {
  email: string | null
  onLogout: () => void
}) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">
          Analyze LLM
        </a>

        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-muted-foreground">{email}</span>}
          <Button size="sm" variant="ghost" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
