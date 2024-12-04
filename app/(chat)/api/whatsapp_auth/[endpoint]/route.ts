import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import postgres from 'postgres';

export async function GET(
  request: NextApiRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = (await params);
  if (endpoint === "start") {
    try {
      return NextResponse.json({
        message: "Socket Initialised..."
      })
    } catch(ex) {
      throw ex;
    }

  }

  throw new Error("Invalid ENDPOINT...")
}