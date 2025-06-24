import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uploadId: string; collaboratorId: string } },
) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId, collaboratorId } = params
    const { role } = await request.json()

    if (!ObjectId.isValid(uploadId) || !ObjectId.isValid(collaboratorId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    if (!["viewer", "editor"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const result = await db.collection("collaborations").updateOne(
      {
        _id: new ObjectId(collaboratorId),
        uploadId: new ObjectId(uploadId),
      },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update collaborator:", error)
    return NextResponse.json({ error: "Failed to update collaborator" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uploadId: string; collaboratorId: string } },
) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId, collaboratorId } = params

    if (!ObjectId.isValid(uploadId) || !ObjectId.isValid(collaboratorId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const result = await db.collection("collaborations").deleteOne({
      _id: new ObjectId(collaboratorId),
      uploadId: new ObjectId(uploadId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove collaborator:", error)
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
  }
}
