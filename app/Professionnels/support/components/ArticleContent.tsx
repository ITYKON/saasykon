'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ArticleContentProps {
  title: string;
  content: React.ReactNode;
  category: string;
  backLink: string;
}

export default function ArticleContent({ title, content, category, backLink }: ArticleContentProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link 
          href={backLink} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Retour aux catégories
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="font-medium">{category}</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
        
        <div className="prose prose-blue max-w-none">
          {content}
        </div>
      </div>
    </div>
  );
}
