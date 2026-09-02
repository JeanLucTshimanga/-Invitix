import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guests, events, eventTables, qrCodes } from "@/db/schema-sqlite";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const { guestId } = await params;

  const [guest] = await db
    .select()
    .from(guests)
    .where(eq(guests.id, guestId))
    .limit(1);

  if (!guest) return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, guest.eventId))
    .limit(1);

  let table = null;
  if (guest.tableId) {
    const [t] = await db
      .select()
      .from(eventTables)
      .where(eq(eventTables.id, guest.tableId))
      .limit(1);
    table = t;
  }

  let [qrCode] = await db
    .select()
    .from(qrCodes)
    .where(eq(qrCodes.guestId, guestId))
    .limit(1);

  if (!qrCode) {
    const token = uuidv4();
    const [newQr] = await db
      .insert(qrCodes)
      .values({
        guestId,
        token,
        qrData: JSON.stringify({ token, guestId, eventId: guest.eventId }),
      })
      .returning();
    qrCode = newQr;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const scanUrl = `${baseUrl}/scan?token=${qrCode.token}`;

  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 250,
    margin: 2,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  // Mark invitation as opened if not sent yet
  if (guest.invitationStatus === "not_sent") {
    await db
      .update(guests)
      .set({ invitationStatus: "sent", updatedAt: new Date() })
      .where(eq(guests.id, guestId));
  }

  return NextResponse.json({
    guest,
    event,
    table,
    qrCode,
    qrDataUrl,
    scanUrl,
  });
}
