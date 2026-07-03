import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupBarcode } from "@/lib/food-sources";
import { createClient } from "@/lib/supabase/server";

const codeSchema = z.string().regex(/^[0-9]{6,14}$/, "Invalid barcode");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) {
    return NextResponse.json({ error: "That doesn't look like a product barcode." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const food = await lookupBarcode(parsed.data);
  if (!food) {
    return NextResponse.json(
      { error: "No verified match for this barcode. You can add it as a personal food instead." },
      { status: 404 }
    );
  }
  return NextResponse.json({ food });
}
