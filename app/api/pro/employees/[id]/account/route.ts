import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

async function requireAccess(employeeId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(employeeId)) return { status: 400 as const, error: "Invalid employee id" };
  const emp = await prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true, business_id: true } });
  if (!emp) return { status: 404 as const, error: "Not found" };
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === emp.business_id && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };
  return { status: 200 as const, emp, ctx };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const link = await prisma.employee_accounts.findFirst({ where: { employee_id: params.id }, select: { user_id: true, users: { select: { email: true, first_name: true, last_name: true } } } });
  return NextResponse.json({ account: link ? { user_id: link.user_id, user: link.users } : null });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body || !body.user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  const user = await prisma.users.findUnique({ where: { id: body.user_id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await prisma.employee_accounts.upsert({ where: { user_id: body.user_id }, update: { employee_id: params.id }, create: { user_id: body.user_id, employee_id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await requireAccess(params.id);
    if (access.status !== 200) {
      logger.warn(`Tentative non autorisée de suppression de compte employé - ID: ${params.id}`, { 
        error: access.error,
        status: access.status,
        employeeId: params.id
      });
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Récupérer les informations du compte avant suppression pour les logs
    const account = await prisma.employee_accounts.findFirst({
      where: { employee_id: params.id },
      include: { 
        users: { 
          select: { 
            email: true, 
            first_name: true, 
            last_name: true 
          } 
        } 
      }
    });

    logger.info(`Suppression du compte employé - ID: ${params.id}`, {
      employeeId: params.id,
      accountEmail: account?.users?.email,
      accountName: account?.users ? `${account.users.first_name} ${account.users.last_name}` : 'Inconnu',
      businessId: access.emp.business_id
    });

    // Désactiver d'abord l'employé au lieu de le supprimer
    await prisma.employees.update({
      where: { id: params.id },
      data: { 
        is_active: false,
        // Effacer les informations sensibles
        email: null,
        phone: null,
        // Marquer comme supprimé dans les logs
        updated_at: new Date()
      }
    });
    
    // Supprimer le compte utilisateur associé
    await prisma.employee_accounts.deleteMany({ 
      where: { employee_id: params.id } 
    });
    
    // Supprimer les rôles et services associés
    await prisma.$transaction([
      prisma.employee_roles.deleteMany({ 
        where: { employee_id: params.id } 
      }),
      prisma.employee_services.deleteMany({ 
        where: { employee_id: params.id } 
      }),
      prisma.employee_availability_overrides.deleteMany({
        where: { employee_id: params.id }
      })
    ]);

    logger.info(`Compte employé, ses dépendances et l'employé ont été supprimés avec succès - ID: ${params.id}`, {
      employeeId: params.id,
      accountEmail: account?.users?.email,
      accountName: account?.users ? `${account.users.first_name} ${account.users.last_name}` : 'Inconnu'
    });

    return NextResponse.json({ 
      ok: true,
      message: "Le compte employé a été supprimé avec succès"
    });

  } catch (error: any) {
    logger.error(`Erreur lors de la suppression du compte employé - ID: ${params.id}`, {
      error: error.message,
      stack: error.stack,
      employeeId: params.id
    });

    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de la suppression du compte employé",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
