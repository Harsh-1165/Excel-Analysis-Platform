"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { FileSpreadsheet, AlertCircle, Loader2, Eye, Edit, Users, Clock, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DataPreview from "@/components/data-preview"
import DataMapper from "@/components/data-mapper"
import ChartGenerator from "@/components/chart-generator"
import AISummaryGenerator from "@/components/ai-summary-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SharedData {
  link: {
    role: "viewer" | "editor"
    expiresAt?: string
    accessCount: number
  }
  upload: {
    id: string
    fileName: string
    originalName: string
    headers: string[]
    data: any[][]
    totalRows: number
    totalColumns: number
    sheetName: string
    uploadDate: string
  }
}

export default function SharedFilePage() {
  const params = useParams()
  const token = params.token as string

  const [sharedData, setSharedData] = useState<SharedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("preview")

  useEffect(() => {
    loadSharedData()
  }, [token])

  const loadSharedData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shared/${token}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load shared file")
      }

      const data = await response.json()
      setSharedData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shared file")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <div className="font-semibold">Loading Shared File</div>
                <div className="text-sm text-gray-600">Please wait...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!sharedData) {
    return null
  }

  const parsedData = {
    headers: sharedData.upload.headers,
    data: sharedData.upload.data,
    fileName: sharedData.upload.fileName,
    sheetName: sharedData.upload.sheetName,
    totalRows: sharedData.upload.totalRows,
    uploadId: sharedData.upload.id,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shared Excel Analysis
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Collaborative access to "{sharedData.upload.originalName}"
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Access Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Access Information
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${sharedData.link.role === "editor" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                    >
                      {sharedData.link.role === "editor" ? (
                        <Edit className="h-3 w-3 mr-1" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      {sharedData.link.role} Access
                    </Badge>
                    {sharedData.link.expiresAt && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires: {formatDate(sharedData.link.expiresAt)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{sharedData.upload.originalName}</div>
                    <div className="text-sm text-gray-600">File Name</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {sharedData.upload.totalRows.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{sharedData.upload.totalColumns}</div>
                    <div className="text-sm text-gray-600">Columns</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{sharedData.link.accessCount}</div>
                    <div className="text-sm text-gray-600">Total Access</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList
                className={`grid w-full ${sharedData.link.role === "editor" ? "grid-cols-4" : "grid-cols-2"} bg-white/50 backdrop-blur-sm`}
              >
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Data Preview
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Charts
                </TabsTrigger>
                {sharedData.link.role === "editor" && (
                  <>
                    <TabsTrigger value="mapper" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Data Mapper
                    </TabsTrigger>
                    <TabsTrigger value="ai-summary" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      AI Analysis
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="preview" className="mt-6">
                <DataPreview data={parsedData} />
              </TabsContent>

              <TabsContent value="charts" className="mt-6">
                <ChartGenerator data={parsedData} />
              </TabsContent>

              {sharedData.link.role === "editor" && (
                <>
                  <TabsContent value="mapper" className="mt-6">
                    <DataMapper data={parsedData} />
                  </TabsContent>

                  <TabsContent value="ai-summary" className="mt-6">
                    <AISummaryGenerator data={parsedData} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
