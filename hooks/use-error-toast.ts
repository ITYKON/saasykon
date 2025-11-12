"use client"

import React from 'react';
import { useToast } from "./use-toast";

interface ApiError extends Error {
  status?: number;
  errors?: Array<{ message: string }>;
  [key: string]: any;
}

export function useErrorToast() {
  const { toast } = useToast();

  const showError = (error: unknown, defaultMessage = "Une erreur est survenue") => {
    let title = "Erreur";
    let description = defaultMessage;
    
    // Gestion des erreurs d'API
    if (error && typeof error === 'object') {
      const apiError = error as ApiError;
      
      // Erreur avec un message
      if ('message' in apiError && typeof apiError.message === 'string') {
        description = apiError.message;
      }
      
      // Erreur avec un statut
      if ('status' in apiError && apiError.status === 401) {
        title = "Non autorisé";
        description = "Veuillez vous connecter pour continuer";
      }
      
      // Erreur de validation
      if ('errors' in apiError && Array.isArray(apiError.errors)) {
        description = apiError.errors.map(e => e.message).join('\n');
      }
    }

    // Création du contenu du toast
    const errorContent = React.createElement(
      'div',
      { className: 'space-y-2' },
      React.createElement('p', { className: 'font-medium' }, description),
process.env.NODE_ENV === 'development' && error ?
        React.createElement(
          'details',
          { className: 'mt-2 text-xs opacity-75' },
          [
            React.createElement('summary', { key: 'summary', className: 'cursor-pointer' }, 'Détails techniques'),
            React.createElement(
              'pre',
              { 
                key: 'pre',
                className: 'mt-1 p-2 bg-black/10 rounded overflow-auto max-h-40',
                dangerouslySetInnerHTML: { 
                  __html: JSON.stringify(error, null, 2)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                }
              }
            )
          ]
        ) : null
    );

    toast({
      variant: "destructive",
      title,
      description: errorContent,
    });
  };

  return { showError };
}
