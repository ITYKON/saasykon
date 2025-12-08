import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Accès refusé
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/pro/dashboard">
              Retour au tableau de bord
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
