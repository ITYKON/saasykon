'use client';

import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getArticleBySlug } from '../config';
import { ArticleContent } from '../ArticleContent';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link 
          href="/Professionnels/support" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Retour à l'aide
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{article.title}</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8">
          <ArticleContent content={article.content} />
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cet article vous a-t-il été utile ?</h2>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Oui
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Non
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
