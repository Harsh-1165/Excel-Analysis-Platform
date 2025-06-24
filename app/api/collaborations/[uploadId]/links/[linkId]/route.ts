import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { uploadId: string; linkId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId, linkId } = params
    const { isActive } = await request.json()

    if (!ObjectId.isValid(uploadId) || !ObjectId.isValid(linkId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const result = await db.collection("shareable_links").updateOne(
      {
        _id: new ObjectId(linkId),
        uploadId: new ObjectId(uploadId),
      },
      {
        $set: {
          isActive,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Shareable link not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update shareable link:", error)
    return NextResponse.json({ error: "Failed to update shareable link" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { uploadId: string; linkId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId, linkId } = params

    if (!ObjectId.isValid(uploadId) || !ObjectId.isValid(linkId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const result = await db.collection("shareable_links").deleteOne({
      _id: new ObjectId(linkId),
      uploadId: new ObjectId(uploadId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Shareable link not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete shareable link:", error)
    return NextResponse.json({ error: "Failed to delete shareable link" }, { status: 500 })
  }
}
