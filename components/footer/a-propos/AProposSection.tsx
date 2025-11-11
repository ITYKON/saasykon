import Link from "next/link";

export const AProposSection = () => {
  return (
    <div>
      <h3 className="font-semibold text-black mb-4">À propos</h3>
      <ul className="space-y-2 text-gray-600">
        <li>
          <Link href="/a-propos/qui-sommes-nous" className="hover:text-black transition-colors">
            Qui sommes-nous
          </Link>
        </li>
        <li>
          <Link href="/a-propos/contact" className="hover:text-black transition-colors">
            Contact
          </Link>
        </li>
        <li>
          <Link href="/a-propos/mentions-legales" className="hover:text-black transition-colors">
            Mentions légales
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AProposSection;
