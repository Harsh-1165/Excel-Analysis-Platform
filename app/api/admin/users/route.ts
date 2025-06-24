import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get all users with aggregated data
    const users = await db
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "uploads",
            localField: "_id",
            foreignField: "userId",
            as: "uploads",
          },
        },
        {
          $lookup: {
            from: "charts",
            localField: "_id",
            foreignField: "userId",
            as: "charts",
          },
        },
        {
          $lookup: {
            from: "ai_summaries",
            localField: "_id",
            foreignField: "userId",
            as: "aiSummaries",
          },
        },
        {
          $addFields: {
            uploadsCount: { $size: "$uploads" },
            chartsCount: { $size: "$charts" },
            aiSummariesCount: { $size: "$aiSummaries" },
            totalDataPoints: { $sum: "$uploads.totalRows" },
            storageUsed: { $sum: "$uploads.fileSize" },
          },
        },
        {
          $project: {
            uploads: 0,
            charts: 0,
            aiSummaries: 0,
            password: 0,
          },
        },
      ])
      .toArray()

    // If no users exist, create sample data
    if (users.length === 0) {
      const sampleUsers = [
        {
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isActive: true,
          uploadsCount: 0,
          chartsCount: 0,
          aiSummariesCount: 0,
          totalDataPoints: 0,
          storageUsed: 0,
        },
        {
          email: "john.doe@example.com",
          name: "John Doe",
          role: "user",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          isActive: true,
          uploadsCount: 5,
          chartsCount: 12,
          aiSummariesCount: 3,
          totalDataPoints: 15420,
          storageUsed: 2048576, // 2MB
        },
        {
          email: "jane.smith@example.com",
          name: "Jane Smith",
          role: "user",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          isActive: true,
          uploadsCount: 8,
          chartsCount: 20,
          aiSummariesCount: 6,
          totalDataPoints: 32150,
          storageUsed: 5242880, // 5MB
        },
        {
          email: "inactive.user@example.com",
          name: "Inactive User",
          role: "user",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          isActive: false,
          uploadsCount: 2,
          chartsCount: 3,
          aiSummariesCount: 1,
          totalDataPoints: 5000,
          storageUsed: 1048576, // 1MB
        },
      ]

      // Insert sample users
      const insertResult = await db.collection("users").insertMany(sampleUsers)

      return NextResponse.json(
        sampleUsers.map((user, index) => ({
          ...user,
          id: insertResult.insertedIds[index].toString(),
        })),
      )
    }

    return NextResponse.json(
      users.map((user) => ({
        ...user,
        id: user._id.toString(),
        _id: undefined,
      })),
    )
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
