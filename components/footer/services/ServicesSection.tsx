import Link from "next/link";

export const ServicesSection = () => {
  return (
    <div>
      <h3 className="font-semibold text-black mb-4">Services</h3>
      <ul className="space-y-2 text-gray-600">
        {/* <li>
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
        </li> */}
        <li>
          <Link href="/institut" className="hover:text-black transition-colors">
            Institut de beauté
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default ServicesSection;
