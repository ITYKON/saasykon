import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] bg-white flex flex-col items-center justify-start pt-2 md:pt-4 p-6 text-center overflow-hidden">
      {/* Background Decorative Element - Further reduced to lift content high */}
      <div className="relative mb-0 flex justify-center items-center w-full max-w-5xl">
        <h1 className="text-[8rem] md:text-[12rem] font-serif font-extralight text-gray-50 leading-none select-none tracking-tighter">
          404
        </h1>
        {/* Subtle center line */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
           <div className="w-px h-8 bg-gray-300"></div>
        </div>
      </div>

      <div className="max-w-4xl space-y-8 -mt-8 md:-mt-12 relative z-10 px-4">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-6xl font-serif text-gray-900 tracking-tight leading-[1.1]">
            La page que vous recherchez<br />
            <span className="italic opacity-80">semblerait introuvable</span>
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-gray-100"></div>
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-[0.4em]">
                Code erreur 404
            </p>
            <div className="h-px w-8 bg-gray-100"></div>
          </div>
        </div>

        <div className="pt-2 space-y-6">
          <p className="text-gray-400 text-[10px] font-medium uppercase tracking-[0.4em]">
            Voici quelques liens utiles à la place :
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-y-4 md:gap-x-12">
            <Link 
              href="/" 
              className="group relative inline-block text-[11px] uppercase tracking-[0.3em] text-gray-500 hover:text-black transition-colors"
            >
              <span className="relative z-10 italic">Accueil</span>
              <span className="absolute bottom-[-6px] left-0 w-full h-[1px] bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out origin-left"></span>
            </Link>
            <Link 
              href="/client/dashboard" 
               className="group relative inline-block text-[11px] uppercase tracking-[0.3em] text-gray-500 hover:text-black transition-colors"
            >
              <span className="relative z-10">Mon compte</span>
              <span className="absolute bottom-[-6px] left-0 w-full h-[1px] bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out origin-left"></span>
            </Link>
            <Link 
              href="/pro" 
               className="group relative inline-block text-[11px] uppercase tracking-[0.3em] text-gray-500 hover:text-black transition-colors"
            >
              <span className="relative z-10">Je suis un professionnel</span>
              <span className="absolute bottom-[-6px] left-0 w-full h-[1px] bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out origin-left"></span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 text-gray-200 text-[8px] uppercase tracking-[0.6em] font-light">
        <p>© {new Date().getFullYear()} YOKA — L'excellence en beauté</p>
      </div>
    </div>
  )
}
