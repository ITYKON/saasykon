"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-black tracking-wide">
              PLANITY
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/coiffeur" className="text-gray-700 hover:text-black transition-colors">
              Coiffeur
            </Link>
            <Link href="/barbier" className="text-gray-700 hover:text-black transition-colors">
              Barbier
            </Link>
            <Link href="/manucure" className="text-gray-700 hover:text-black transition-colors">
              Manucure
            </Link>
            <Link href="/institut-de-beaute" className="text-gray-700 hover:text-black transition-colors">
              Institut de beauté
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex bg-transparent border-gray-300 hover:bg-gray-50"
            >
              Je suis un professionnel de beauté
            </Button>
            <Button size="sm" className="bg-black text-white hover:bg-gray-800" asChild>
              <Link href="/auth/login">Mon compte</Link>
            </Button>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/coiffeur" className="text-gray-700 hover:text-black transition-colors">
                Coiffeur
              </Link>
              <Link href="/barbier" className="text-gray-700 hover:text-black transition-colors">
                Barbier
              </Link>
              <Link href="/manucure" className="text-gray-700 hover:text-black transition-colors">
                Manucure
              </Link>
              <Link href="/institut-de-beaute" className="text-gray-700 hover:text-black transition-colors">
                Institut de beauté
              </Link>
              <Button variant="outline" size="sm" className="w-full bg-transparent border-gray-300 hover:bg-gray-50">
                Je suis un professionnel de beauté
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
