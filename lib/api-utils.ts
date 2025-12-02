// Fonction utilitaire pour gérer les appels API côté serveur et client
export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const isServer = typeof window === 'undefined';
  const baseURL = isServer 
    ? process.env.INTERNAL_API_URL 
    : process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la requête API');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API:', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      endpoint,
      isServer,
      baseURL
    });
    throw error;
  }
};

// Exemple d'utilisation dans getServerSideProps ou getStaticProps
export async function fetchServerSide(endpoint: string, headers?: Headers) {
  const baseURL = process.env.INTERNAL_API_URL;
  
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(headers ? { cookie: headers.get('cookie') || '' } : {})
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur fetch côté serveur:', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      endpoint,
      baseURL
    });
    throw error;
  }
}
