import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "YOKA - Réservez en beauté",
  description:
    "Trouvez rapidement un salon de coiffure, institut de beauté, un barbier près de chez vous. RDV en ligne 24/7. Confirmation immédiate.",
  generator: "YOKA",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <Header />
          {children}
          <Footer />
          <Analytics />
          <Toaster />
        </Suspense>
      </body>
    </html>
  )
}
