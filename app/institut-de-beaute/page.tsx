import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

function slugifyCity(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function SearchForm() {
  async function searchAction(formData: FormData) {
    "use server"
    const q = formData.get("q")?.toString().trim()
    const where = formData.get("where")?.toString().trim()

    if (where && where.length > 0) {
      const slug = slugifyCity(where)
      // Validate city exists to avoid 404
      const allCities = await prisma.cities.findMany({ select: { name: true } })
      const exists = allCities.some((c) => slugifyCity(c.name) === slug)
      if (exists) {
        redirect(`/institut-de-beaute/${slug}`)
      }
      // Fallback: show list with all cities and preserve desired city in query
      const qs = new URLSearchParams()
      qs.set("all", "1")
      if (q) qs.set("q", q)
      qs.set("city", slug)
      redirect(`/institut-de-beaute?${qs.toString()}`)
    }

    // Default: stay on listing, optionally could pass q in querystring later
    redirect(`/institut-de-beaute`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
      <form action={searchAction} className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Input
              name="q"
              type="text"
              placeholder="Que cherchez-vous ?"
              defaultValue="Instituts de beauté"
              className="border-0 focus:ring-0 text-gray-900 bg-transparent"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="relative">
            <Input
              name="where"
              type="text"
              placeholder="Où"
              defaultValue="Adresse, ville..."
              className="border-0 focus:ring-0 text-gray-500 bg-transparent"
            />
          </div>
        </div>
        <Button type="submit" className="bg-black hover:bg-gray-800 text-white px-8">Rechercher</Button>
      </form>
    </div>
  )
}

export default async function InstitutDeBeautePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const cities = await prisma.cities.findMany({
    orderBy: { name: "asc" },
  })
  const showAll = (typeof searchParams?.all === "string" && searchParams?.all === "1") ||
    (Array.isArray(searchParams?.all) && searchParams?.all.includes("1"))
  const cityList = showAll ? cities : cities.slice(0, 12)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Découvrez en ligne un RDV avec un institut de beauté
            </h1>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Cities Section (from DB) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Institut de beauté</h2>
          </div>

          {/* Featured Algerian Cities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              { name: "Béjaïa", slug: slugifyCity("Béjaïa"), img: "/beauty-salon-reception-area-with-modern-decor.jpg" },
              { name: "Alger", slug: slugifyCity("Alger"), img: "/elegant-beauty-salon-interior-with-warm-lighting-a.jpg" },
              { name: "Oran", slug: slugifyCity("Oran"), img: "/modern-spa-interior-marseille.jpg" },
            ].map((c) => (
              <Link key={c.slug} href={`/institut-de-beaute/${c.slug}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={c.img}
                      alt={`${c.name} - Institut de beauté`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-2">Découvrez nos</p>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Instituts de beauté à {c.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* All Cities from DB */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {cityList.map((city) => {
              const slug = slugifyCity(city.name)
              return (
                <Link key={`${city.id}-${slug}`} href={`/institut-de-beaute/${slug}`} className="group">
                  <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <div className="w-8 h-8 bg-gray-300 rounded-full group-hover:bg-blue-300 transition-colors"></div>
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{city.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Instituts de beauté</p>
                  </div>
                </Link>
              )
            })}
          </div>
          {!showAll && cities.length > 12 && (
            <div className="flex justify-center mt-10">
              <Button asChild className="bg-black hover:bg-gray-800 text-white">
                <Link href="/institut-de-beaute?all=1">Voir plus</Link>
              </Button>
            </div>
          )}
          {showAll && cities.length > 12 && (
            <div className="flex justify-center mt-10">
              <Button asChild variant="outline">
                <Link href="/institut-de-beaute">Voir moins</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Services d'instituts de beauté</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez tous les soins de beauté disponibles dans nos instituts partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Soins du visage", description: "Nettoyage, hydratation, anti-âge" },
              { name: "Épilation", description: "Cire, laser, lumière pulsée" },
              { name: "Massage", description: "Relaxant, thérapeutique, bien-être" },
              { name: "Manucure & Pédicure", description: "Soins des ongles et des mains" },
              { name: "Maquillage", description: "Jour, soirée, mariée" },
              { name: "Soins du corps", description: "Gommage, enveloppement, minceur" },
              { name: "Bronzage", description: "UV, autobronzant, spray tan" },
              { name: "Sourcils & Cils", description: "Teinture, extension, rehaussement" },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous êtes propriétaire d'un institut de beauté ?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Rejoignez YOKA et développez votre clientèle grâce à notre plateforme de réservation en ligne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
              Devenir partenaire
            </Button>
            <Button size="lg" variant="outline">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

