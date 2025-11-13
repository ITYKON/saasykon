'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, CheckCircle } from 'lucide-react';

// Schéma de validation avec Zod
const documentFormSchema = z.object({
  rcNumber: z.string().min(1, 'Le numéro RC est requis'),
  rcDocument: z.any()
    .refine(files => files?.length > 0, {
      message: 'Le document du registre de commerce est requis',
    })
    .refine(files => files?.[0]?.size <= 5 * 1024 * 1024, {
      message: 'La taille maximale est de 5MB',
    }),
  idDocumentFront: z.any()
    .refine(files => files?.length > 0, {
      message: 'La pièce d\'identité (recto) est requise',
    })
    .refine(files => files?.[0]?.size <= 5 * 1024 * 1024, {
      message: 'La taille maximale est de 5MB',
    }),
  idDocumentBack: z.any()
    .refine(files => files?.length > 0, {
      message: 'La pièce d\'identité (verso) est requise',
    })
    .refine(files => files?.[0]?.size <= 5 * 1024 * 1024, {
      message: 'La taille maximale est de 5MB',
    }),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export default function DocumentUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      rcNumber: '',
    },
  });

  const onSubmit = async (data: DocumentFormValues) => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('rcNumber', data.rcNumber);
      formData.append('rcDocument', data.rcDocument[0]);
      formData.append('idDocumentFront', data.idDocumentFront[0]);
      formData.append('idDocumentBack', data.idDocumentBack[0]);
      
      const response = await fetch('/api/business/verification', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la soumission des documents');
      }
      
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Documents soumis avec succès</span>
          </div>
        ),
        description: (
          <div className="space-y-1">
            <p>Vos documents sont en cours de vérification.</p>
            <p className="text-sm text-muted-foreground">
              Redirection vers le tableau de bord...
            </p>
          </div>
        ),
        duration: 2000,
        className: 'border-green-200 bg-green-50',
      });
      
      // Rediriger vers le tableau de bord après un court délai
      setTimeout(() => {
        router.push('/pro/dashboard');
        // Forcer un rechargement complet pour s'assurer que les données sont à jour
        router.refresh();
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission des documents:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la soumission des documents. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File, fieldName: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fieldName]: progress }));
        }
      };
      
      xhr.open('POST', '/api/upload', true);
      await xhr.send(formData);
      
      // Simuler une URL de fichier pour la démo
      return `https://example.com/uploads/${file.name}`;
      
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vérification d'identité</h1>
        <p className="text-muted-foreground">
          Pour des raisons de sécurité, nous devons vérifier votre identité et votre entreprise.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Documents requis</CardTitle>
          <CardDescription>
            Veuillez fournir les documents suivants pour vérifier votre identité et votre entreprise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="rcNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de registre de commerce</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rcDocument"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Extrait du registre de commerce</FormLabel>
                      <FormDescription>
                        Téléchargez un scan ou une photo de l'extrait de registre de commerce de votre entreprise.
                        Le document doit être clairement lisible et à jour.
                      </FormDescription>
                      <FormControl>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                onChange(e.target.files);
                              }
                            }}
                            {...rest}
                          />
                          {uploadProgress.rcDocument > 0 && uploadProgress.rcDocument < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress.rcDocument}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="idDocumentFront"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Pièce d'identité (Recto)</FormLabel>
                        <FormDescription>
                          Téléchargez le recto de votre pièce d'identité (CNI, Passeport ou Carte de séjour).
                        </FormDescription>
                        <FormControl>
                          <div className="mt-2">
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  onChange(e.target.files);
                                }
                              }}
                              {...rest}
                            />
                            {uploadProgress.idDocumentFront > 0 && uploadProgress.idDocumentFront < 100 && (
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${uploadProgress.idDocumentFront}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="idDocumentBack"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Pièce d'identité (Verso)</FormLabel>
                        <FormDescription>
                          Téléchargez le verso de votre pièce d'identité (CNI, Passeport ou Carte de séjour).
                        </FormDescription>
                        <FormControl>
                          <div className="mt-2">
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  onChange(e.target.files);
                                }
                              }}
                              {...rest}
                            />
                            {uploadProgress.idDocumentBack > 0 && uploadProgress.idDocumentBack < 100 && (
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${uploadProgress.idDocumentBack}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Envoi en cours...' : 'Soumettre les documents'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Conseils pour vos documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <span>Assurez-vous que les documents sont bien visibles et non flous</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <span>Les fichiers doivent être au format JPG, PNG ou PDF (max 5 Mo)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <span>Vérifiez que toutes les informations sont lisibles et non coupées</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <span>Les documents doivent être à jour et valides</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
