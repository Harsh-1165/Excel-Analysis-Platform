"use client"

import type React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { generateColumns } from "@/components/columns"
import { Button } from "@/components/ui/button"
import { UploadCloud, Calculator } from "lucide-react"
import * as XLSX from "xlsx"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import CustomFormulaEngine from "@/components/custom-formula-engine"
import SmartChartRecommender from "@/components/smart-chart-recommender"

export default function UploadPage() {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true)
    const file = event.target.files?.[0]

    if (!file) {
      setLoading(false)
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
      setUploadedData(jsonData)
      setLoading(false)
      toast({
        title: "Success!",
        description: "File uploaded successfully.",
      })
    }

    reader.readAsArrayBuffer(file)
  }

  // Generate columns dynamically based on uploaded data
  const columns = uploadedData ? generateColumns(uploadedData) : []

  // Transform data for CustomFormulaEngine
  const formulaEngineData = uploadedData ? {
    headers: uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [],
    data: uploadedData.map(row => Object.values(row)),
    fileName: "uploaded-file",
    sheetName: "Sheet1",
    totalRows: uploadedData.length
  } : null

  return (
    <div className="container mx-auto max-w-7xl py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Data Table</h1>
        <input
          type="file"
          id="upload"
          accept=".xlsx, .xls, .csv"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <Button asChild disabled={loading}>
          <label htmlFor="upload" className="flex items-center gap-2">
            {loading ? (
              <>
                <UploadCloud className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Upload File
              </>
            )}
          </label>
        </Button>
      </div>

      <Tabs defaultValue="table" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="table">
            <Upload className="h-4 w-4 mr-2" />
            Table
          </TabsTrigger>
          <TabsTrigger value="formulas" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Formula Engine
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-6">
          {uploadedData && columns.length > 0 ? (
            <DataTable data={uploadedData} columns={columns} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border-dashed border-2 border-gray-300 rounded-md bg-gray-50">
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-500">No data uploaded yet. Please upload a file.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="formulas" className="mt-6">
          {formulaEngineData ? (
            <CustomFormulaEngine 
              data={formulaEngineData} 
              onDataUpdate={(newData) => {
                // Transform the updated data back to the format expected by the table
                if (newData && newData.data) {
                  const transformedData = newData.data.map((row: any[], index: number) => {
                    const obj: any = {}
                    newData.headers.forEach((header: string, headerIndex: number) => {
                      obj[header] = row[headerIndex]
                    })
                    return obj
                  })
                  setUploadedData(transformedData)
                }
              }} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border-dashed border-2 border-gray-300 rounded-md bg-gray-50">
              <Calculator className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-500">Upload data first to use the formula engine.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Chart Analysis Section */}
      {uploadedData && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chart Analysis</h2>
          <SmartChartRecommender
            data={{
              headers: uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [],
              data: uploadedData.map(row => Object.values(row)),
              fileName: "uploaded-file",
              sheetName: "Sheet1",
              totalRows: uploadedData.length
            }}
          />
        </div>
      )}
      <Toaster />
    </div>
  )
} 