import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import crypto from "crypto"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()

    const webhook = await db.collection("webhooks").findOne({
      _id: new ObjectId(params.id),
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    // Create test payload
    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from Excel Analysis Platform",
        webhook_id: webhook._id.toString(),
        webhook_name: webhook.name,
      },
    }

    // Create signature
    const signature = crypto.createHmac("sha256", webhook.secret).update(JSON.stringify(testPayload)).digest("hex")

    // Send webhook
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "User-Agent": "Excel-Analysis-Platform-Webhook/1.0",
        },
        body: JSON.stringify(testPayload),
      })

      // Update webhook stats
      if (response.ok) {
        await db.collection("webhooks").updateOne(
          { _id: new ObjectId(params.id) },
          {
            $inc: { successCount: 1 },
            $set: { lastTriggered: new Date() },
          },
        )
      } else {
        await db.collection("webhooks").updateOne(
          { _id: new ObjectId(params.id) },
          {
            $inc: { failureCount: 1 },
          },
        )
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      })
    } catch (fetchError) {
      // Update failure count
      await db.collection("webhooks").updateOne(
        { _id: new ObjectId(params.id) },
        {
          $inc: { failureCount: 1 },
        },
      )

      return NextResponse.json({
        success: false,
        error: "Failed to send webhook",
      })
    }
  } catch (error) {
    console.error("Failed to test webhook:", error)
    return NextResponse.json({ error: "Failed to test webhook" }, { status: 500 })
  }
}
