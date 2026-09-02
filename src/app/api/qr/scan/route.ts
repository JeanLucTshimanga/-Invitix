import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCodes, guests, events, eventTables, checkins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  // Find QR code
  const [qrCode] = await db
    .select()
    .from(qrCodes)
    .where(eq(qrCodes.token, token))
    .limit(1);

  if (!qrCode) {
    return NextResponse.json({
      valid: false,
      status: "invalid",
      message: "QR Code invalide",
    });
  }

  // Get guest
  const [guest] = await db
    .select()
    .from(guests)
    .where(eq(guests.id, qrCode.guestId))
    .limit(1);

  if (!guest) {
    return NextResponse.json({
      valid: false,
      status: "invalid",
      message: "Invité non trouvé",
    });
  }

  // Get event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, guest.eventId))
    .limit(1);

  // Get table
  let table = null;
  if (guest.tableId) {
    const [t] = await db
      .select()
      .from(eventTables)
      .where(eq(eventTables.id, guest.tableId))
      .limit(1);
    table = t || null;
  }

  if (qrCode.isUsed || guest.isPresent) {
    return NextResponse.json({
      valid: false,
      status: "already_used",
      message: "Invitation déjà utilisée",
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        category: guest.category,
        allowedPersons: guest.allowedPersons,
        table: table ? { number: table.tableNumber, name: table.name } : null,
        checkedInAt: guest.checkedInAt,
      },
      event: event ? { name: event.name, date: event.date } : null,
    });
  }

  return NextResponse.json({
    valid: true,
    status: "valid",
    message: "Invitation valide",
    guest: {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      category: guest.category,
      allowedPersons: guest.allowedPersons,
      table: table ? { number: table.tableNumber, name: table.name } : null,
    },
    event: event ? { name: event.name, date: event.date } : null,
    qrCodeId: qrCode.id,
  });
}
