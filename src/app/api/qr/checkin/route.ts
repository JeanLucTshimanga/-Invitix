import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCodes, guests, checkins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { guestId, qrCodeId } = await request.json();

  if (!guestId) return NextResponse.json({ error: "guestId requis" }, { status: 400 });

  // Update guest
  const [updatedGuest] = await db
    .update(guests)
    .set({
      isPresent: true,
      checkedInAt: new Date(),
      rsvpStatus: "confirmed",
      invitationStatus: "opened",
      updatedAt: new Date(),
    })
    .where(eq(guests.id, guestId))
    .returning();

  if (!updatedGuest) {
    return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });
  }

  // Mark QR as used
  if (qrCodeId) {
    await db
      .update(qrCodes)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(qrCodes.id, qrCodeId));
  }

  // Create checkin record
  await db.insert(checkins).values({
    guestId,
    eventId: updatedGuest.eventId,
    checkedInById: user.id,
    checkedInAt: new Date(),
  });

  return NextResponse.json({ success: true, guest: updatedGuest });
}
