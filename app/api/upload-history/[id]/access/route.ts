import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    const result = await db.collection("uploads").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastAccessed: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update access time:", error)
    return NextResponse.json({ error: "Failed to update access time" }, { status: 500 })
  }
}
