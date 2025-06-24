"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Mail,
  Calendar,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CollaborationData {
  collaboration: {
    id: string
    email: string
    role: "viewer" | "editor"
    fileName: string
    invitedBy: string
    invitedAt: string
  }
  upload: {
    id: string
    fileName: string
    originalName: string
    totalRows: number
    totalColumns: number
    sheetName: string
  }
}

export default function CollaborationAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [collaborationData, setCollaborationData] = useState<CollaborationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    loadCollaborationData()
  }, [token])

  const loadCollaborationData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/collaborate/${token}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load invitation")
      }

      const data = await response.json()
      setCollaborationData(data)
      setUserEmail(data.collaboration.email)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!userEmail.trim()) {
      setError("Please enter your email address")
      return
    }

    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch(`/api/collaborate/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: userEmail.trim(),
          userName: userName.trim() || userEmail.split("@")[0],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to accept invitation")
      }

      setSuccess(true)

      // Redirect to the shared file after 2 seconds
      setTimeout(() => {
        router.push(`/shared/${collaborationData?.upload.id}`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation")
    } finally {
      setIsAccepting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
                <div className="font-semibold">Loading Invitation</div>
                <div className="text-sm text-gray-600">Please wait...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h2>
              <p className="text-gray-600 mb-6">
                You've successfully joined as a collaborator. Redirecting you to the shared file...
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
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
              Collaboration Invitation
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You've been invited to collaborate on an Excel analysis project
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {collaborationData && (
            <>
              {/* Invitation Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      Invitation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">File Name</Label>
                        <div className="text-lg font-semibold">{collaborationData.upload.originalName}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Your Role</Label>
                        <Badge
                          className={`w-fit ${collaborationData.collaboration.role === "editor" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                        >
                          {collaborationData.collaboration.role === "editor" ? (
                            <Edit className="h-3 w-3 mr-1" />
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          {collaborationData.collaboration.role}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Invited By</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{collaborationData.collaboration.invitedBy}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Invitation Date</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(collaborationData.collaboration.invitedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">File Information</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {collaborationData.upload.totalRows.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Rows</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {collaborationData.upload.totalColumns}
                          </div>
                          <div className="text-xs text-gray-600">Columns</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">{collaborationData.upload.sheetName}</div>
                          <div className="text-xs text-gray-600">Sheet</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Your Permissions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>View Excel data and generated charts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Access data analysis and AI summaries</span>
                        </div>
                        {collaborationData.collaboration.role === "editor" && (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Edit and modify data mappings</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Generate new charts and visualizations</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Create AI summaries and analyses</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Accept Invitation Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Accept Invitation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        disabled={isAccepting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name (Optional)</Label>
                      <Input
                        id="name"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Your display name"
                        disabled={isAccepting}
                      />
                    </div>

                    <Button
                      onClick={handleAcceptInvitation}
                      disabled={isAccepting || !userEmail.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Accepting Invitation...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept Invitation & Join Collaboration
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By accepting this invitation, you agree to collaborate on this Excel analysis project with the
                      specified permissions.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
