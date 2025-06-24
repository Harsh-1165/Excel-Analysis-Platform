import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Delete user's uploads
    await db.collection("uploads").deleteMany({ userId: new ObjectId(id) })

    // Delete user's charts
    await db.collection("charts").deleteMany({ userId: new ObjectId(id) })

    // Delete user's AI summaries
    await db.collection("ai_summaries").deleteMany({ userId: new ObjectId(id) })

    // Delete the user
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
