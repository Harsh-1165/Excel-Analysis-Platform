import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    const upload = await db.collection("uploads").findOne({ _id: new ObjectId(id) })

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...upload,
      id: upload._id.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("Failed to fetch upload:", error)
    return NextResponse.json({ error: "Failed to fetch upload" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    // Get upload info first
    const upload = await db.collection("uploads").findOne({ _id: new ObjectId(id) })
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Delete related charts
    await db.collection("charts").deleteMany({ "dataSource.fileName": upload.fileName })

    // Delete related AI summaries
    await db.collection("ai_summaries").deleteMany({ "dataSource.fileName": upload.fileName })

    // Delete the upload record
    const result = await db.collection("uploads").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete upload:", error)
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 })
  }
}
