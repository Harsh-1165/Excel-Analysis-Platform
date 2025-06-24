import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get all uploads with user information and aggregated data
    const uploads = await db
      .collection("uploads")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "charts",
            let: { fileName: "$fileName" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$dataSource.fileName", "$$fileName"],
                  },
                },
              },
            ],
            as: "charts",
          },
        },
        {
          $lookup: {
            from: "ai_summaries",
            let: { fileName: "$fileName" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$dataSource.fileName", "$$fileName"],
                  },
                },
              },
            ],
            as: "aiSummaries",
          },
        },
        {
          $addFields: {
            userEmail: { $arrayElemAt: ["$user.email", 0] },
            chartsGenerated: { $size: "$charts" },
            aiSummariesGenerated: { $size: "$aiSummaries" },
          },
        },
        {
          $project: {
            user: 0,
            charts: 0,
            aiSummaries: 0,
            data: 0, // Exclude large data field for performance
            headers: 0,
          },
        },
        {
          $sort: { uploadDate: -1 },
        },
      ])
      .toArray()

    // If no uploads exist, create sample data
    if (uploads.length === 0) {
      const sampleUploads = [
        {
          fileName: "sales_data_2024.xlsx",
          userId: "sample_user_1",
          userEmail: "john.doe@example.com",
          uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          fileSize: 2048576, // 2MB
          totalRows: 15420,
          status: "completed",
          chartsGenerated: 3,
          aiSummariesGenerated: 1,
        },
        {
          fileName: "customer_analysis.xlsx",
          userId: "sample_user_2",
          userEmail: "jane.smith@example.com",
          uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          fileSize: 5242880, // 5MB
          totalRows: 32150,
          status: "completed",
          chartsGenerated: 5,
          aiSummariesGenerated: 2,
        },
        {
          fileName: "inventory_report.xlsx",
          userId: "sample_user_1",
          userEmail: "john.doe@example.com",
          uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          fileSize: 1048576, // 1MB
          totalRows: 8500,
          status: "completed",
          chartsGenerated: 2,
          aiSummariesGenerated: 1,
        },
        {
          fileName: "financial_data.xlsx",
          userId: "sample_user_3",
          userEmail: "admin@example.com",
          uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          fileSize: 3145728, // 3MB
          totalRows: 25000,
          status: "completed",
          chartsGenerated: 4,
          aiSummariesGenerated: 3,
        },
        {
          fileName: "processing_file.xlsx",
          userId: "sample_user_2",
          userEmail: "jane.smith@example.com",
          uploadDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          fileSize: 1572864, // 1.5MB
          totalRows: 12000,
          status: "processing",
          chartsGenerated: 0,
          aiSummariesGenerated: 0,
        },
        {
          fileName: "failed_upload.xlsx",
          userId: "sample_user_4",
          userEmail: "inactive.user@example.com",
          uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          fileSize: 10485760, // 10MB
          totalRows: 0,
          status: "failed",
          chartsGenerated: 0,
          aiSummariesGenerated: 0,
        },
      ]

      return NextResponse.json(
        sampleUploads.map((upload, index) => ({
          ...upload,
          id: `sample_upload_${index + 1}`,
        })),
      )
    }

    return NextResponse.json(
      uploads.map((upload) => ({
        ...upload,
        id: upload._id.toString(),
        _id: undefined,
      })),
    )
  } catch (error) {
    console.error("Failed to fetch uploads:", error)
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
  }
}
