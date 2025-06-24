import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId } = params
    const { email, role, message, fileName } = await request.json()

    if (!ObjectId.isValid(uploadId)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    if (!email || !["viewer", "editor"].includes(role)) {
      return NextResponse.json({ error: "Invalid invitation data" }, { status: 400 })
    }

    // Check if collaboration already exists
    const existingCollab = await db.collection("collaborations").findOne({
      uploadId: new ObjectId(uploadId),
      email: email.toLowerCase(),
    })

    if (existingCollab) {
      return NextResponse.json({ error: "User is already a collaborator" }, { status: 400 })
    }

    // Get upload info
    const upload = await db.collection("uploads").findOne({ _id: new ObjectId(uploadId) })
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Create collaboration record
    const invitationToken = new ObjectId().toString()
    const collaboration = {
      uploadId: new ObjectId(uploadId),
      email: email.toLowerCase(),
      name: email.split("@")[0], // Default name from email
      role,
      status: "pending",
      invitedAt: new Date(),
      invitationToken,
      fileName: upload.fileName,
      invitedBy: "current-user@example.com", // TODO: Get from session
    }

    const result = await db.collection("collaborations").insertOne(collaboration)

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/collaborate/${invitationToken}`

    await sendEmail({
      to: email,
      subject: `Invitation to collaborate on "${fileName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You've been invited to collaborate!</h2>
          <p>You've been invited to collaborate on the Excel file "<strong>${fileName}</strong>" with <strong>${role}</strong> access.</p>
          ${message ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-style: italic;">"${message}"</p>` : ""}
          <div style="margin: 30px 0;">
            <a href="${invitationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            As a <strong>${role}</strong>, you will be able to:
          </p>
          <ul style="color: #6b7280; font-size: 14px;">
            <li>View the Excel data and generated charts</li>
            ${role === "editor" ? "<li>Edit and modify the data</li><li>Generate new charts and analyses</li>" : ""}
          </ul>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      collaborationId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Failed to send invitation:", error)
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
  }
}
