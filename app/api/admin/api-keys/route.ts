import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { nanoid } from "nanoid"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const apiKeys = await db.collection("api_keys").find({}).sort({ createdAt: -1 }).toArray()

    // If no API keys exist, create sample data
    if (apiKeys.length === 0) {
      const sampleKeys = [
        {
          name: "Production API Key",
          key: `sk_live_${nanoid(32)}`,
          permissions: ["upload:files", "read:data", "create:charts", "generate:summaries"],
          rateLimit: 5000,
          usageCount: 2847,
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          expiresAt: null,
        },
        {
          name: "Development API Key",
          key: `sk_dev_${nanoid(32)}`,
          permissions: ["upload:files", "read:data", "create:charts"],
          rateLimit: 1000,
          usageCount: 156,
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          isActive: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          expiresAt: null,
        },
        {
          name: "Testing API Key",
          key: `sk_test_${nanoid(32)}`,
          permissions: ["read:data"],
          rateLimit: 100,
          usageCount: 23,
          lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          isActive: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      ]

      const insertResult = await db.collection("api_keys").insertMany(sampleKeys)

      return NextResponse.json(
        sampleKeys.map((key, index) => ({
          ...key,
          id: insertResult.insertedIds[index].toString(),
        })),
      )
    }

    return NextResponse.json(
      apiKeys.map((key) => ({
        ...key,
        id: key._id.toString(),
        _id: undefined,
      })),
    )
  } catch (error) {
    console.error("Failed to fetch API keys:", error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, permissions, rateLimit, expiresAt } = await request.json()

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Generate API key
    const apiKey = `sk_${nanoid(8)}_${nanoid(32)}`

    const newKey = {
      name,
      key: apiKey,
      permissions,
      rateLimit: rateLimit || 1000,
      usageCount: 0,
      lastUsed: null,
      isActive: true,
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }

    const result = await db.collection("api_keys").insertOne(newKey)

    return NextResponse.json({
      ...newKey,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
