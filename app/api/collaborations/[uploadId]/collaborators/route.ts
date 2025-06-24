import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId } = params

    if (!ObjectId.isValid(uploadId)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    const collaborations = await db
      .collection("collaborations")
      .find({ uploadId: new ObjectId(uploadId) })
      .sort({ invitedAt: -1 })
      .toArray()

    const collaborators = collaborations.map((collab) => ({
      id: collab._id.toString(),
      email: collab.email,
      name: collab.name || collab.email.split("@")[0],
      role: collab.role,
      status: collab.status,
      invitedAt: collab.invitedAt,
      acceptedAt: collab.acceptedAt,
      lastActive: collab.lastActive,
      avatar: collab.avatar,
      permissions: {
        canView: true,
        canEdit: collab.role === "editor",
        canShare: collab.role === "editor",
        canDelete: false,
      },
    }))

    return NextResponse.json(collaborators)
  } catch (error) {
    console.error("Failed to fetch collaborators:", error)
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 })
  }
}
