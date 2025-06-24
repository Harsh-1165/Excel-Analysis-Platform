import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import crypto from "crypto"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const webhooks = await db.collection("webhooks").find({}).sort({ createdAt: -1 }).toArray()

    // If no webhooks exist, create sample data
    if (webhooks.length === 0) {
      const sampleWebhooks = [
        {
          name: "File Processing Webhook",
          url: "https://api.example.com/webhooks/file-processed",
          events: ["file.uploaded", "analysis.completed"],
          secret: crypto.randomBytes(32).toString("hex"),
          isActive: true,
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          successCount: 45,
          failureCount: 2,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
        {
          name: "Chart Generation Webhook",
          url: "https://dashboard.example.com/api/chart-created",
          events: ["chart.created"],
          secret: crypto.randomBytes(32).toString("hex"),
          isActive: true,
          lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          successCount: 23,
          failureCount: 0,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          name: "Error Notification Webhook",
          url: "https://alerts.example.com/webhook",
          events: ["error.occurred"],
          secret: crypto.randomBytes(32).toString("hex"),
          isActive: false,
          lastTriggered: null,
          successCount: 0,
          failureCount: 0,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      ]

      const insertResult = await db.collection("webhooks").insertMany(sampleWebhooks)

      return NextResponse.json(
        sampleWebhooks.map((webhook, index) => ({
          ...webhook,
          id: insertResult.insertedIds[index].toString(),
        })),
      )
    }

    return NextResponse.json(
      webhooks.map((webhook) => ({
        ...webhook,
        id: webhook._id.toString(),
        _id: undefined,
      })),
    )
  } catch (error) {
    console.error("Failed to fetch webhooks:", error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, url, events } = await request.json()

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString("hex")

    const newWebhook = {
      name,
      url,
      events,
      secret,
      isActive: true,
      lastTriggered: null,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date(),
    }

    const result = await db.collection("webhooks").insertOne(newWebhook)

    return NextResponse.json({
      ...newWebhook,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Failed to create webhook:", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
