"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { usePathname } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { auth, loading } = useAuth()
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    if (isHomePage) {
      window.addEventListener("scroll", handleScroll)
      // Initial check
      handleScroll()
    } else {
      setIsScrolled(true)
    }

    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomePage])

  const headerClasses = isHomePage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen
          ? "bg-white border-b border-gray-200 py-2 shadow-sm" 
          : "bg-transparent border-transparent py-4"
      }`
    : "border-b border-gray-200 bg-white sticky top-0 z-50"

  const textClasses = isHomePage && !isScrolled && !isMenuOpen ? "text-white" : "text-black"
  const navTextClasses = isHomePage && !isScrolled && !isMenuOpen ? "text-white/90 hover:text-white" : "text-gray-700 hover:text-black"

  const proButtonClasses = isHomePage && !isScrolled && !isMenuOpen
    ? "hidden md:inline-flex bg-white text-black border-transparent hover:bg-gray-100"
    : "hidden md:inline-flex bg-transparent border-gray-300 hover:bg-gray-50 text-gray-700"

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className={`text-2xl font-bold tracking-wide transition-colors ${textClasses}`}>
              YOKA
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/institut-de-beaute" className={`transition-colors ${navTextClasses}`}>
            Institut de beauté
            </Link>
            {/* <Link href="/coiffeur" className="text-gray-700 hover:text-black transition-colors">
              Coiffeur
            </Link>
            <Link href="/barbier" className="text-gray-700 hover:text-black transition-colors">
              Barbier
            </Link>
            <Link href="/manucure" className="text-gray-700 hover:text-black transition-colors">
              Manucure
            </Link> */}

          </nav>

          <div className="flex items-center space-x-4">
            {!auth && !loading && (
              <Button
                variant="outline"
                size="sm"
                className={proButtonClasses}
                asChild
              >
                <Link href="/auth/pro">Je suis un professionnel de beauté</Link>
              </Button>
            )}
            <Button size="sm" className="bg-black text-white hover:bg-gray-800" asChild>
              <Link href="/auth/login">Mon compte</Link>
            </Button>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`md:hidden ${isHomePage && !isScrolled && !isMenuOpen ? "text-white hover:bg-white/10" : "text-black"}`} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/institut-de-beaute" className="text-gray-700 hover:text-black transition-colors">
                Institut de beauté
              </Link>
              {!auth && !loading && (
                <Button variant="outline" size="sm" className="w-full bg-transparent border-gray-300 hover:bg-gray-50" asChild>
                  <Link href="/auth/pro">Je suis un professionnel de beauté</Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
