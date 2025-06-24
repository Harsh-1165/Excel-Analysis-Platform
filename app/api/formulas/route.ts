import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    const formulas = await db.collection("formulas").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(
      formulas.map((formula) => ({
        ...formula,
        id: formula._id.toString(),
      })),
    )
  } catch (error) {
    console.error("Failed to fetch formulas:", error)
    return NextResponse.json({ error: "Failed to fetch formulas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, expression, description, result, fileName } = body

    if (!name || !expression) {
      return NextResponse.json({ error: "Name and expression are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const formula = {
      name,
      expression,
      description: description || "",
      result,
      fileName,
      isValid: true,
      createdAt: new Date().toISOString(),
    }

    const insertResult = await db.collection("formulas").insertOne(formula)

    return NextResponse.json({
      ...formula,
      id: insertResult.insertedId.toString(),
    })
  } catch (error) {
    console.error("Failed to save formula:", error)
    return NextResponse.json({ error: "Failed to save formula" }, { status: 500 })
  }
}
