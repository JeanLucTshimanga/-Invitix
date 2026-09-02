import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCodes, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { guestId } = await params;

  const [guest] = await db.select().from(guests).where(eq(guests.id, guestId)).limit(1);
  if (!guest) return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });

  let [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.guestId, guestId)).limit(1);

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
    width: 300,
    margin: 2,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  return NextResponse.json({ qrCode, qrDataUrl, scanUrl });
}
