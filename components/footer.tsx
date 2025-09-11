import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-black tracking-wide mb-4">PLANITY</div>
            <p className="text-gray-600">La plateforme de réservation beauté n°1 en France</p>
          </div>
          <div>
            <h3 className="font-semibold text-black mb-4">Services</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/coiffeur" className="hover:text-black transition-colors">
                  Coiffeur
                </Link>
              </li>
              <li>
                <Link href="/barbier" className="hover:text-black transition-colors">
                  Barbier
                </Link>
              </li>
              <li>
                <Link href="/manucure" className="hover:text-black transition-colors">
                  Manucure
                </Link>
              </li>
              <li>
                <Link href="/institut" className="hover:text-black transition-colors">
                  Institut de beauté
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-black mb-4">Professionnels</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/pro/register" className="hover:text-black transition-colors">
                  Devenir partenaire
                </Link>
              </li>
              <li>
                <Link href="/pro/login" className="hover:text-black transition-colors">
                  Espace pro
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-black transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-black mb-4">À propos</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/about" className="hover:text-black transition-colors">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-black transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-black transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2024 Planity. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
