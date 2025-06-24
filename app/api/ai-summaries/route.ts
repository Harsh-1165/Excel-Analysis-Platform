import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const summaries = await db.collection("ai_summaries").find({}).sort({ createdAt: -1 }).limit(10).toArray()

    return NextResponse.json(
      summaries.map((summary) => ({
        ...summary,
        id: summary._id.toString(),
        _id: undefined,
      })),
    )
  } catch (error) {
    console.error("Failed to fetch AI summaries:", error)
    return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = await connectToDatabase()

    const summaryData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("ai_summaries").insertOne(summaryData)

    // Update the upload record to include this AI summary
    if (body.dataSource?.fileName) {
      await db.collection("uploads").updateOne(
        { fileName: body.dataSource.fileName },
        {
          $push: {
            aiSummariesGenerated: {
              id: result.insertedId.toString(),
              analysisType: body.analysisType || "comprehensive",
              createdAt: new Date(),
            },
          },
        },
      )
    }

    return NextResponse.json({
      ...summaryData,
      id: result.insertedId.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("Failed to save AI summary:", error)
    return NextResponse.json({ error: "Failed to save summary" }, { status: 500 })
  }
}
