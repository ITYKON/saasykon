 import Link from "next/link";
import { ServicesSection } from "./footer/services/ServicesSection";
import { ProfessionnelsSection } from "./footer/professionnels/ProfessionnelsSection";
import { AProposSection } from "./footer/a-propos/AProposSection";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-black tracking-wide mb-4">YOKA</div>
            <p className="text-gray-600">Là où la beauté rencontre la technologie.</p>
          </div>
          <ServicesSection />
          <ProfessionnelsSection />
          <AProposSection />
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2026 YOKA. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
