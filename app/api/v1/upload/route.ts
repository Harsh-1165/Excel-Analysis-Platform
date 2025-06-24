import { NextResponse } from "next/server"
import { verifyApiKey, rateLimitMiddleware } from "@/lib/api-middleware"

export async function POST(request: Request) {
  try {
    // Verify API key
    const apiKeyResult = await verifyApiKey(request, ["upload:files"])
    if (!apiKeyResult.valid) {
      return NextResponse.json({ error: apiKeyResult.error }, { status: apiKeyResult.status })
    }

    // Check rate limit
    const rateLimitResult = await rateLimitMiddleware(request, apiKeyResult.apiKey!)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded"
        },
        { status: 429 }
      )
    }
