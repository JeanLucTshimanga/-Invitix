import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guests, qrCodes } from "@/db/schema-sqlite";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const [guest] = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  if (!guest) return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });

  const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.guestId, id)).limit(1);

  return NextResponse.json({ guest, qrCode });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  const fields = [
    "firstName", "lastName", "email", "phone", "photo",
    "category", "allowedPersons", "tableId", "rsvpStatus",
    "isPresent", "invitationStatus", "notes"
  ];

  fields.forEach((field) => {
    if (body[field] !== undefined) updateData[field] = body[field];
  });

  if (body.isPresent === true && body.checkedInAt === undefined) {
    updateData.checkedInAt = new Date();
  }

  const [updated] = await db
    .update(guests)
    .set(updateData)
    .where(eq(guests.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });

  return NextResponse.json({ guest: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  await db.delete(qrCodes).where(eq(qrCodes.guestId, id));
  await db.delete(guests).where(eq(guests.id, id));

  return NextResponse.json({ success: true });
}
