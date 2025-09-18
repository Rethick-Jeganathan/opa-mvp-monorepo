import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:4001/context/aws/accounts", { next: { revalidate: 0 } });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
