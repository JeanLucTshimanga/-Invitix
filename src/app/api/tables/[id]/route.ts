import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventTables, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(eventTables)
    .set({
      tableNumber: body.tableNumber,
      name: body.name,
      capacity: body.capacity,
      notes: body.notes,
    })
    .where(eq(eventTables.id, id))
    .returning();

  return NextResponse.json({ table: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  // Unassign guests from this table
  await db
    .update(guests)
    .set({ tableId: null, updatedAt: new Date() })
    .where(eq(guests.tableId, id));

  await db.delete(eventTables).where(eq(eventTables.id, id));

  return NextResponse.json({ success: true });
}
