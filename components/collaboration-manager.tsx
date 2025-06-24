"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  UserPlus,
  Link,
  Eye,
  Edit,
  Trash2,
  Copy,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  MoreHorizontal,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Collaborator {
  id: string
  email: string
  name: string
  role: "viewer" | "editor"
  status: "active" | "pending" | "revoked"
  invitedAt: string
  acceptedAt?: string
  lastActive?: string
  avatar?: string
  permissions: {
    canView: boolean
    canEdit: boolean
    canShare: boolean
    canDelete: boolean
  }
}

interface ShareableLink {
  id: string
  url: string
  role: "viewer" | "editor"
  expiresAt?: string
  isActive: boolean
  accessCount: number
  createdAt: string
  lastAccessed?: string
}

interface CollaborationManagerProps {
  uploadId: string
  fileName: string
  isOwner: boolean
  currentUserEmail: string
}

export default function CollaborationManager({
  uploadId,
  fileName,
  isOwner,
  currentUserEmail,
}: CollaborationManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [shareableLinks, setShareableLinks] = useState<ShareableLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer")
  const [inviteMessage, setInviteMessage] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Shareable link form state
  const [linkRole, setLinkRole] = useState<"viewer" | "editor">("viewer")
  const [linkExpiry, setLinkExpiry] = useState<string>("never")
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  useEffect(() => {
    loadCollaborationData()
  }, [uploadId])

  const loadCollaborationData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [collaboratorsRes, linksRes] = await Promise.all([
        fetch(`/api/collaborations/${uploadId}/collaborators`),
        fetch(`/api/collaborations/${uploadId}/links`),
      ])

      if (!collaboratorsRes.ok || !linksRes.ok) {
        throw new Error("Failed to load collaboration data")
      }

      const collaboratorsData = await collaboratorsRes.json()
      const linksData = await linksRes.json()

      setCollaborators(collaboratorsData)
      setShareableLinks(linksData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collaboration data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    setError(null)

    try {
      const response = await fetch(`/api/collaborations/${uploadId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          message: inviteMessage,
          fileName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send invitation")
      }

      setSuccess("Invitation sent successfully!")
      setInviteEmail("")
      setInviteMessage("")
      setShowInviteDialog(false)
      loadCollaborationData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const handleCreateShareableLink = async () => {
    setIsCreatingLink(true)
    setError(null)

    try {
      const expiresAt =
        linkExpiry === "never" ? null : new Date(Date.now() + Number.parseInt(linkExpiry) * 24 * 60 * 60 * 1000)

      const response = await fetch(`/api/collaborations/${uploadId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: linkRole,
          expiresAt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create shareable link")
      }

      setSuccess("Shareable link created successfully!")
      setShowLinkDialog(false)
      loadCollaborationData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shareable link")
    } finally {
      setIsCreatingLink(false)
    }
  }

  const handleUpdateCollaboratorRole = async (collaboratorId: string, newRole: "viewer" | "editor") => {
    try {
      const response = await fetch(`/api/collaborations/${uploadId}/collaborators/${collaboratorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update collaborator role")
      }

      setSuccess("Collaborator role updated successfully!")
      loadCollaborationData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update collaborator role")
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(`/api/collaborations/${uploadId}/collaborators/${collaboratorId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove collaborator")
      }

      setSuccess("Collaborator removed successfully!")
      loadCollaborationData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove collaborator")
    }
  }

  const handleToggleLink = async (linkId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/collaborations/${uploadId}/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle link status")
      }

      setSuccess(`Link ${isActive ? "activated" : "deactivated"} successfully!`)
      loadCollaborationData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle link status")
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/collaborations/${uploadId}/links/${linkId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete link")
      }

      setSuccess("Shareable link deleted successfully!")
      loadCollaborationData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete link")
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess("Link copied to clipboard!")
    } catch (err) {
      setError("Failed to copy link")
    }
  }

  const filteredCollaborators = collaborators.filter((collaborator) => {
    const matchesSearch =
      collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || collaborator.status === statusFilter
    const matchesRole = roleFilter === "all" || collaborator.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case "editor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "viewer":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "revoked":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <div className="font-semibold">Loading Collaboration Data</div>
              <div className="text-sm text-gray-600">Please wait...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Collaboration Manager
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage collaborators and shareable links for "{fileName}"</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadCollaborationData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {isOwner && (
                <>
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Collaborator
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite Collaborator</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="collaborator@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Access Level</Label>
                          <Select
                            value={inviteRole}
                            onValueChange={(value: "viewer" | "editor") => setInviteRole(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Viewer - Can view data and charts
                                </div>
                              </SelectItem>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  Editor - Can view and modify data
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                          <Textarea
                            id="invite-message"
                            placeholder="Add a personal message to the invitation..."
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={handleInviteCollaborator}
                          disabled={isInviting || !inviteEmail.trim()}
                          className="w-full"
                        >
                          {isInviting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Sending Invitation...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Link className="h-4 w-4 mr-2" />
                        Create Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Shareable Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="link-role">Access Level</Label>
                          <Select value={linkRole} onValueChange={(value: "viewer" | "editor") => setLinkRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Viewer Access
                                </div>
                              </SelectItem>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  Editor Access
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="link-expiry">Link Expiry</Label>
                          <Select value={linkExpiry} onValueChange={setLinkExpiry}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">Never expires</SelectItem>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleCreateShareableLink} disabled={isCreatingLink} className="w-full">
                          {isCreatingLink ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating Link...
                            </>
                          ) : (
                            <>
                              <Link className="h-4 w-4 mr-2" />
                              Create Link
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Collaborators</p>
                  <p className="text-2xl font-bold text-blue-900">{collaborators.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Collaborators</p>
                  <p className="text-2xl font-bold text-green-900">
                    {collaborators.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Shareable Links</p>
                  <p className="text-2xl font-bold text-purple-900">{shareableLinks.length}</p>
                </div>
                <Link className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Link Access</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {shareableLinks.reduce((sum, link) => sum + link.accessCount, 0)}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="collaborators" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="collaborators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaborators ({collaborators.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Shareable Links ({shareableLinks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="mt-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search collaborators..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredCollaborators.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Collaborators Found</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                      ? "No collaborators match your current filters."
                      : "Invite collaborators to start sharing your data."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Collaborator</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Invited</TableHead>
                        <TableHead className="font-semibold">Last Active</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCollaborators.map((collaborator, index) => (
                        <motion.tr
                          key={collaborator.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={collaborator.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {collaborator.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{collaborator.name}</div>
                                <div className="text-sm text-gray-500">{collaborator.email}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className={`text-xs ${getRoleColor(collaborator.role)}`}>
                              {collaborator.role === "editor" ? (
                                <Edit className="h-3 w-3 mr-1" />
                              ) : (
                                <Eye className="h-3 w-3 mr-1" />
                              )}
                              {collaborator.role}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge className={`text-xs ${getStatusColor(collaborator.status)}`}>
                              {collaborator.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {collaborator.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                              {collaborator.status === "revoked" && <XCircle className="h-3 w-3 mr-1" />}
                              {collaborator.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">{formatDate(collaborator.invitedAt)}</div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              {collaborator.lastActive ? formatDate(collaborator.lastActive) : "Never"}
                            </div>
                          </TableCell>

                          <TableCell>
                            {isOwner && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateCollaboratorRole(
                                        collaborator.id,
                                        collaborator.role === "viewer" ? "editor" : "viewer",
                                      )
                                    }
                                  >
                                    {collaborator.role === "viewer" ? (
                                      <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Make Editor
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Make Viewer
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Access
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {shareableLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Link className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Shareable Links</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Create shareable links to give access without requiring email invitations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Link</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Access Count</TableHead>
                        <TableHead className="font-semibold">Expires</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shareableLinks.map((link, index) => (
                        <motion.tr
                          key={link.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-xs">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate">
                                {link.url.split("/").pop()}
                              </code>
                              <Button
                                onClick={() => copyToClipboard(link.url)}
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className={`text-xs ${getRoleColor(link.role)}`}>
                              {link.role === "editor" ? (
                                <Edit className="h-3 w-3 mr-1" />
                              ) : (
                                <Eye className="h-3 w-3 mr-1" />
                              )}
                              {link.role}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-xs ${link.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                              >
                                {link.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {isOwner && (
                                <Switch
                                  checked={link.isActive}
                                  onCheckedChange={(checked) => handleToggleLink(link.id, checked)}
                                  size="sm"
                                />
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm font-medium">{link.accessCount}</div>
                            {link.lastAccessed && (
                              <div className="text-xs text-gray-500">Last: {formatDate(link.lastAccessed)}</div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">{link.expiresAt ? formatDate(link.expiresAt) : "Never"}</div>
                          </TableCell>

                          <TableCell>
                            {isOwner && (
                              <Button
                                onClick={() => handleDeleteLink(link.id)}
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
