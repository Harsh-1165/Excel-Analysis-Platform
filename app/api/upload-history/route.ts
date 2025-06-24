import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const dateFilter = searchParams.get("dateFilter") || "all"

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
        { sheetName: { $regex: search, $options: "i" } },
      ]
    }

    if (status !== "all") {
      query.status = status
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      query.uploadDate = { $gte: filterDate }
    }

    // Get uploads with pagination
    const uploads = await db
      .collection("uploads")
      .find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // Get total count
    const totalCount = await db.collection("uploads").countDocuments(query)

    // Enrich with chart and AI summary data
    const enrichedUploads = await Promise.all(
      uploads.map(async (upload) => {
        // Get charts for this upload
        const charts = await db
          .collection("charts")
          .find({ "dataSource.fileName": upload.fileName })
          .project({ _id: 1, name: 1, type: 1, createdAt: 1 })
          .toArray()

        // Get AI summaries for this upload
        const aiSummaries = await db
          .collection("ai_summaries")
          .find({ "dataSource.fileName": upload.fileName })
          .project({ _id: 1, analysisType: 1, createdAt: 1 })
          .toArray()

        return {
          ...upload,
          id: upload._id.toString(),
          _id: undefined,
          chartsGenerated: charts.map((chart) => ({
            id: chart._id.toString(),
            name: chart.name,
            type: chart.type,
            createdAt: chart.createdAt,
          })),
          aiSummariesGenerated: aiSummaries.map((summary) => ({
            id: summary._id.toString(),
            analysisType: summary.analysisType || "comprehensive",
            createdAt: summary.createdAt,
          })),
        }
      }),
    )

    return NextResponse.json({
      uploads: enrichedUploads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Failed to fetch upload history:", error)
    return NextResponse.json({ error: "Failed to fetch upload history" }, { status: 500 })
  }
}

// For the simplified version used by the component
export async function GET_SIMPLE() {
  try {
    const { db } = await connectToDatabase()

    const uploads = await db.collection("uploads").find({}).sort({ uploadDate: -1 }).toArray()

    const enrichedUploads = await Promise.all(
      uploads.map(async (upload) => {
        const charts = await db
          .collection("charts")
          .find({ "dataSource.fileName": upload.fileName })
          .project({ _id: 1, name: 1, type: 1, createdAt: 1 })
          .toArray()

        const aiSummaries = await db
          .collection("ai_summaries")
          .find({ "dataSource.fileName": upload.fileName })
          .project({ _id: 1, analysisType: 1, createdAt: 1 })
          .toArray()

        return {
          ...upload,
          id: upload._id.toString(),
          _id: undefined,
          chartsGenerated: charts.map((chart) => ({
            id: chart._id.toString(),
            name: chart.name,
            type: chart.type,
            createdAt: chart.createdAt,
          })),
          aiSummariesGenerated: aiSummaries.map((summary) => ({
            id: summary._id.toString(),
            analysisType: summary.analysisType || "comprehensive",
            createdAt: summary.createdAt,
          })),
        }
      }),
    )

    return NextResponse.json(enrichedUploads)
  } catch (error) {
    console.error("Failed to fetch upload history:", error)
    return NextResponse.json({ error: "Failed to fetch upload history" }, { status: 500 })
  }
}
