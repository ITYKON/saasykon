import Link from "next/link";

export const ProfessionnelsSection = () => {
  return (
    <div>
      <h3 className="font-semibold text-black mb-4">Professionnels</h3>
      <ul className="space-y-2 text-gray-600">
        <li>
          <Link href="/auth/pro" className="hover:text-black transition-colors">
            Rejoignez nous
          </Link>
        </li>
        <li>
          <Link href="/pro/login" className="hover:text-black transition-colors">
            Espace pro
          </Link>
        </li>
        <li>
          <Link href="/Professionnels/support" className="hover:text-black transition-colors">
            Support
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default ProfessionnelsSection;
