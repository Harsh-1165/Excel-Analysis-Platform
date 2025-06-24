"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { motion } from "framer-motion"
import { Upload, FileSpreadsheet, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export default function FileUploader({ onFileUpload, isLoading }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    const allowedExtensions = [".xls", ".xlsx"]

    const hasValidType = allowedTypes.includes(file.type)
    const hasValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidType && !hasValidExtension) {
      return "Please upload a valid Excel file (.xls or .xlsx)"
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    return null
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setValidationError(null)

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const error = validateFile(file)

      if (error) {
        setValidationError(error)
        return
      }

      setSelectedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
    disabled: isLoading,
  })

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setValidationError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{
            y: isDragActive ? -10 : 0,
            scale: isDragActive ? 1.1 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
        </motion.div>

        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-700">
            {isDragActive ? "Drop your Excel file here" : "Drag & drop your Excel file"}
          </p>
          <p className="text-sm text-gray-500">
            or <span className="text-blue-600 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400">Supports .xls and .xlsx files up to 10MB</p>
        </div>

        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center"
          >
            <div className="text-blue-600 font-semibold text-lg">Release to upload</div>
          </motion.div>
        )}
      </motion.div>

      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{validationError}</span>
        </motion.div>
      )}

      {selectedFile && !validationError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2" />
              <p className="text-xs text-gray-500 text-center">Uploading and processing...</p>
            </div>
          )}

          {!isLoading && (
            <Button
              onClick={handleUpload}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Parse Excel
            </Button>
          )}
        </motion.div>
      )}
    </div>
  )
}
