import { Metadata } from 'next';
import { getArticleBySlug } from '../config';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    return {
      title: 'Article non trouvé',
    };
  }

  return {
    title: article.title,
    description: article.description,
  };
}
