import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminOrPermission } from "@/lib/authorization";

// Helpers
function generateRoleCodeFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const createRoleSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  // Optional explicit code; if not provided we derive it from name
  code: z.string().min(2).optional(),
  // Array of permission codes (must correspond to permissions.code)
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  id: z.number(),
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAdminOrPermission("roles");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [roles, total] = await Promise.all([
      prisma.roles.findMany({
        include: {
          role_permissions: { include: { permissions: true } },
          user_roles: true,
        },
        orderBy: { id: "desc" },
        skip,
        take,
      }),
      prisma.roles.count(),
    ]);

    const data = roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      permissions: r.role_permissions.map((rp) => rp.permissions.code),
      usersCount: r.user_roles.length,
    }));

    return NextResponse.json({ roles: data, total, page, pageSize });
  } catch (e) {
    console.error("[GET /api/admin/roles] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminOrPermission("roles");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parse = createRoleSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
    }
    const { name } = parse.data;
    const code = parse.data.code ?? generateRoleCodeFromName(name);
    const permissionCodes = [...new Set(parse.data.permissions)];

    // Ensure all permissions exist (create missing by code with empty description)
    if (permissionCodes.length > 0) {
      await Promise.all(
        permissionCodes.map(async (pc) => {
          try {
            await prisma.permissions.upsert({
              where: { code: pc },
              update: {},
              create: { code: pc, description: null },
            });
          } catch (err) {
            console.error("[POST /api/admin/roles] Upsert permission failed:", pc, err);
          }
        }),
      );
    }

    const created = await prisma.roles.create({
      data: {
        code,
        name,
        role_permissions: permissionCodes.length
          ? {
              create: permissionCodes.map((pc) => ({
                permissions: { connect: { code: pc } },
              })),
            }
          : undefined,
      },
      include: { role_permissions: { include: { permissions: true } } },
    });

    return NextResponse.json({
      role: {
        id: created.id,
        code: created.code,
        name: created.name,
        permissions: created.role_permissions.map((rp) => rp.permissions.code),
      },
    });
  } catch (e: any) {
    console.error("[POST /api/admin/roles] Error:", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Le code du rôle existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdminOrPermission("roles");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parse = updateRoleSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
    }

    const { id, name, code, permissions } = parse.data;

    // Update basic fields first
    const updated = await prisma.roles.update({
      where: { id },
      data: {
        name: name ?? undefined,
        code: code ?? undefined,
      },
      include: { role_permissions: { include: { permissions: true } } },
    });

    // If permissions provided, sync them (replace existing set)
    if (permissions) {
      const uniqueCodes = [...new Set(permissions)];
      await Promise.all(
        uniqueCodes.map(async (pc) => {
          await prisma.permissions.upsert({
            where: { code: pc },
            update: {},
            create: { code: pc, description: null },
          });
        }),
      );

      // Sync links: remove existing, then create new ones using real permission ids
      await prisma.role_permissions.deleteMany({ where: { role_id: id } });
      const perms = await prisma.permissions.findMany({ where: { code: { in: uniqueCodes } } });
      if (perms.length > 0) {
        await prisma.$transaction(
          perms.map((perm) =>
            prisma.role_permissions.create({
              data: { role_id: id, permission_id: perm.id },
            }),
          ),
        );
      }
    }

    const finalRole = await prisma.roles.findUnique({
      where: { id },
      include: { role_permissions: { include: { permissions: true } } },
    });

    return NextResponse.json({
      role: finalRole
        ? {
            id: finalRole.id,
            code: finalRole.code,
            name: finalRole.name,
            permissions: finalRole.role_permissions.map((rp) => rp.permissions.code),
          }
        : null,
    });
  } catch (e: any) {
    console.error("[PUT /api/admin/roles] Error:", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Conflit de code de rôle" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminOrPermission("roles");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = idParam ? parseInt(idParam, 10) : NaN;
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });
    }

    // Delete will cascade on role_permissions via FK
    await prisma.roles.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/roles] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


