'use client';

import Link from 'next/link';

interface ArticleContentProps {
  content: string[];
}

export function ArticleContent({ content }: ArticleContentProps) {
  const formatContent = (text: string) => {
    // Remplacer les balises de lien par des composants Link de Next.js
    const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\))/g);
    
    return parts.map((part, index) => {
      // Si la partie correspond à un motif [texte](lien)
      if (part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)) {
        const [, linkText, linkHref] = part.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
        if (linkText && linkHref) {
          return (
            <Link 
              key={index} 
              href={linkHref} 
              className="text-blue-600 hover:underline"
            >
              {linkText}
            </Link>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="prose max-w-none text-gray-700">
      {content.map((paragraph, index) => (
        <p key={index} className="mb-4">
          {formatContent(paragraph)}
        </p>
      ))}
    </div>
  );
}
