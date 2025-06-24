import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { token } = params

    // Find collaboration by invitation token
    const collaboration = await db.collection("collaborations").findOne({
      invitationToken: token,
      status: "pending",
    })

    if (!collaboration) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
    }

    // Check if invitation is expired (7 days)
    const invitedAt = new Date(collaboration.invitedAt)
    const expiryDate = new Date(invitedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (new Date() > expiryDate) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 })
    }

    // Get upload info
    const upload = await db.collection("uploads").findOne({
      _id: collaboration.uploadId,
    })

    if (!upload) {
      return NextResponse.json({ error: "Associated file not found" }, { status: 404 })
    }

    return NextResponse.json({
      collaboration: {
        id: collaboration._id.toString(),
        email: collaboration.email,
        role: collaboration.role,
        fileName: collaboration.fileName,
        invitedBy: collaboration.invitedBy,
        invitedAt: collaboration.invitedAt,
      },
      upload: {
        id: upload._id.toString(),
        fileName: upload.fileName,
        originalName: upload.originalName,
        totalRows: upload.totalRows,
        totalColumns: upload.totalColumns,
        sheetName: upload.sheetName,
      },
    })
  } catch (error) {
    console.error("Failed to validate invitation:", error)
    return NextResponse.json({ error: "Failed to validate invitation" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { token } = params
    const { userEmail, userName } = await request.json()

    // Find and update collaboration
    const result = await db.collection("collaborations").updateOne(
      {
        invitationToken: token,
        status: "pending",
      },
      {
        $set: {
          status: "active",
          acceptedAt: new Date(),
          name: userName || userEmail.split("@")[0],
          lastActive: new Date(),
        },
        $unset: {
          invitationToken: "",
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to accept invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
