import Link from "next/link";
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import Image from "next/image";

const ContactPage = () => {
  return (
    <div className="bg-white">
      {/* En-tête accrocheur */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="text-center lg:text-left mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Une question, une idée ou besoin d'aide ?
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-xl mx-auto lg:mx-0">
                L'équipe Yoka est là pour vous accompagner.
              </p>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Que vous soyez un salon, un professionnel indépendant ou un client, nous serons ravis d'échanger avec vous.
              </p>
            </div>
            <div className="relative h-80 lg:h-96 rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/images/Group Discussion on Content Strategy.jpg"
                alt="L'équipe Yoka en réunion"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Colonne de gauche - Coordonnées */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-md h-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos coordonnées</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-50 p-3 rounded-full">
                    <FaMapMarkerAlt className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Yoka Algérie</h3>
                    <p className="mt-1 text-gray-600">Béjaïa, Algérie</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-50 p-3 rounded-full">
                    <FaEnvelope className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                    <a href="mailto:support@yoka.dz" className="mt-1 text-primary-600 hover:text-primary-800 flex items-center">
                      support@yoka.dz
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-50 p-3 rounded-full">
                    <FaPhoneAlt className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Téléphone</h3>
                    <a href="tel:+213123456789" className="mt-1 text-primary-600 hover:text-primary-800 flex items-center">
                      +213 123 45 67 89
                    </a>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Suivez-nous sur les réseaux</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <FaFacebookF className="h-5 w-5" />
                    </a>
                    <a href="#" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <FaInstagram className="h-5 w-5" />
                    </a>
                    <a href="#" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <FaLinkedinIn className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonne de droite - Carte */}
          <div className="h-full">
            <div className="bg-white p-1 rounded-xl shadow-md h-full">
              <div className="h-full w-full rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d102600.34975288933!2d4.994167!3d36.752887!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12f1c8d8a9999999%3A0x7c1e0a5f8a3c4b4f!2sB%C3%A9ja%C3%AFa%2C%20Alg%C3%A9rie!5e0!3m2!1sfr!2sfr!4v1620000000000!5m2!1sfr!2sfr"
                  width="100%"
                  height="100%"
                  style={{ minHeight: '500px', border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="YOKA - Béjaïa, Algérie"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
