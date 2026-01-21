// app/api/test-ses/route.ts
import { sendEmail, sendTestEmail } from '@/lib/email';

export async function POST() {
  try {
    // Test simple via sendTestEmail
    const result = await sendTestEmail();
    
    // OU test personnalisé (décommente pour tester un email spécifique)
    /*
    await sendEmail({
      to: 'x.x@yatek.fr', // modifie avec ton email vérifié
      subject: 'Test SES depuis Yoka SaaS',
      html: '<h1>Amazon SES fonctionne !</h1><p>Ceci est un test depuis VMYOKA.</p>',
      text: 'Amazon SES fonctionne depuis Yoka SaaS!',
    });
    */

    return Response.json({ 
      success: true, 
      message: 'Email de test envoyé via SES',
      messageId: result.messageId 
    });
  } catch (error: unknown) {
    console.error('Erreur test SES:', error);
    
    // Type assertion sécurisée
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    return Response.json({ 
      error: errorMessage,
      details: errorStack 
    }, { status: 500 });
  }
}

// GET pour vérifier la config
export async function GET() {
  return Response.json({ 
    status: 'ready',
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    from: process.env.EMAIL_FROM 
  });
}