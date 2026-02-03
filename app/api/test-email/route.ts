import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export async function GET() {
  try {
    const result = await sendTestEmail();
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error: unknown) {
    console.error('❌ Error sending test email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test email', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
