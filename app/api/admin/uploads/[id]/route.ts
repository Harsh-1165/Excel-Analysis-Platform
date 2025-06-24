import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    // Handle both ObjectId and string IDs for sample data
    let query: any
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) }
    } else {
      // For sample data with string IDs
      return NextResponse.json({ success: true })
    }

    // Get upload info first
    const upload = await db.collection("uploads").findOne(query)
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Delete related charts
    await db.collection("charts").deleteMany({ "dataSource.fileName": upload.fileName })

    // Delete related AI summaries
    await db.collection("ai_summaries").deleteMany({ "dataSource.fileName": upload.fileName })

    // Delete the upload record
    const result = await db.collection("uploads").deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete upload:", error)
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 })
  }
}
