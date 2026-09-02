import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema-sqlite";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  // Only super_admin can edit others; users can edit themselves
  if (user.role !== "super_admin" && user.id !== id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.firstName) updateData.firstName = body.firstName;
  if (body.lastName) updateData.lastName = body.lastName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.avatar !== undefined) updateData.avatar = body.avatar;

  // Only super_admin can change role and isActive
  if (user.role === "super_admin") {
    if (body.role) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
  }

  if (body.password) {
    updateData.passwordHash = await hashPassword(body.password);
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id, firstName: users.firstName, lastName: users.lastName,
      email: users.email, role: users.role, isActive: users.isActive,
      phone: users.phone, avatar: users.avatar,
    });

  if (!updated) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  if (user.id === id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
