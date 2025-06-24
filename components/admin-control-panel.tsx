"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Shield,
  Users,
  FileSpreadsheet,
  BarChart3,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Calendar,
  TrendingUp,
  Database,
  Activity,
  AlertTriangle,
  UserX,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  createdAt: string
  lastLogin: string
  isActive: boolean
  uploadsCount: number
  chartsCount: number
  aiSummariesCount: number
  totalDataPoints: number
  storageUsed: number
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalUploads: number
  totalCharts: number
  totalAISummaries: number
  totalDataPoints: number
  totalStorageUsed: number
  uploadsToday: number
  uploadsThisWeek: number
  uploadsThisMonth: number
}

interface ActivityData {
  date: string
  uploads: number
  charts: number
  aiSummaries: number
  activeUsers: number
}

interface UploadRecord {
  id: string
  fileName: string
  userId: string
  userEmail: string
  uploadDate: string
  fileSize: number
  totalRows: number
  status: string
  chartsGenerated: number
  aiSummariesGenerated: number
}

export default function AdminControlPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Users tab state
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userCurrentPage, setUserCurrentPage] = useState(1)
  const [userItemsPerPage, setUserItemsPerPage] = useState(10)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null)

  // Uploads tab state
  const [uploadSearchTerm, setUploadSearchTerm] = useState("")
  const [uploadStatusFilter, setUploadStatusFilter] = useState("all")
  const [uploadDateFilter, setUploadDateFilter] = useState("all")
  const [uploadCurrentPage, setUploadCurrentPage] = useState(1)
  const [uploadItemsPerPage, setUploadItemsPerPage] = useState(10)
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null)
  const [isDeletingUpload, setIsDeletingUpload] = useState<string | null>(null)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [usersRes, uploadsRes, statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/uploads"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
      ])

      if (!usersRes.ok || !uploadsRes.ok || !statsRes.ok || !activityRes.ok) {
        throw new Error("Failed to load admin data")
      }

      const [usersData, uploadsData, statsData, activityDataRes] = await Promise.all([
        usersRes.json(),
        uploadsRes.json(),
        statsRes.json(),
        activityRes.json(),
      ])

      setUsers(usersData)
      setUploads(uploadsData)
      setSystemStats(statsData)
      setActivityData(activityDataRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsDeletingUser(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId))
      await loadAdminData() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setIsDeletingUser(null)
    }
  }

  const handleDeleteUpload = async (uploadId: string) => {
    setIsDeletingUpload(uploadId)

    try {
      const response = await fetch(`/api/admin/uploads/${uploadId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete upload")
      }

      setUploads((prev) => prev.filter((upload) => upload.id !== uploadId))
      await loadAdminData() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete upload")
    } finally {
      setIsDeletingUpload(null)
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle user status")
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isActive: !isActive } : user)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle user status")
    }
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter
    const matchesStatus = userStatusFilter === "all" || (userStatusFilter === "active" ? user.isActive : !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Filter uploads
  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch =
      upload.fileName.toLowerCase().includes(uploadSearchTerm.toLowerCase()) ||
      upload.userEmail.toLowerCase().includes(uploadSearchTerm.toLowerCase())
    const matchesStatus = uploadStatusFilter === "all" || upload.status === uploadStatusFilter

    let matchesDate = true
    if (uploadDateFilter !== "all") {
      const now = new Date()
      const uploadDate = new Date(upload.uploadDate)
      const filterDate = new Date()

      switch (uploadDateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          matchesDate = uploadDate >= filterDate
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          matchesDate = uploadDate >= filterDate
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          matchesDate = uploadDate >= filterDate
          break
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // Pagination for users
  const userTotalPages = Math.ceil(filteredUsers.length / userItemsPerPage)
  const userStartIndex = (userCurrentPage - 1) * userItemsPerPage
  const userEndIndex = userStartIndex + userItemsPerPage
  const currentUsers = filteredUsers.slice(userStartIndex, userEndIndex)

  // Pagination for uploads
  const uploadTotalPages = Math.ceil(filteredUploads.length / uploadItemsPerPage)
  const uploadStartIndex = (uploadCurrentPage - 1) * uploadItemsPerPage
  const uploadEndIndex = uploadStartIndex + uploadItemsPerPage
  const currentUploads = filteredUploads.slice(uploadStartIndex, uploadEndIndex)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <div className="font-semibold">Loading Admin Panel</div>
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
      <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6" />
                Admin Control Panel
              </CardTitle>
              <p className="text-blue-100 mt-1">
                Manage users, monitor system activity, and control platform resources
              </p>
            </div>
            <Button onClick={loadAdminData} variant="secondary" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Uploads ({uploads.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {systemStats && (
            <div className="space-y-6">
              {/* System Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{systemStats.totalUsers}</p>
                          <p className="text-xs text-blue-700">{systemStats.activeUsers} active</p>
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
                          <p className="text-sm font-medium text-green-600">Total Uploads</p>
                          <p className="text-2xl font-bold text-green-900">{systemStats.totalUploads}</p>
                          <p className="text-xs text-green-700">{systemStats.uploadsToday} today</p>
                        </div>
                        <FileSpreadsheet className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Charts Generated</p>
                          <p className="text-2xl font-bold text-purple-900">{systemStats.totalCharts}</p>
                          <p className="text-xs text-purple-700">{systemStats.totalAISummaries} AI summaries</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Storage Used</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {formatFileSize(systemStats.totalStorageUsed)}
                          </p>
                          <p className="text-xs text-orange-700">
                            {systemStats.totalDataPoints.toLocaleString()} data points
                          </p>
                        </div>
                        <Database className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Uploads Today</span>
                      <Badge variant="outline">{systemStats.uploadsToday}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Week</span>
                      <Badge variant="outline">{systemStats.uploadsThisWeek}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <Badge variant="outline">{systemStats.uploadsThisMonth}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      User Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Users</span>
                      <Badge variant="default">{systemStats.activeUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Inactive Users</span>
                      <Badge variant="secondary">{systemStats.totalUsers - systemStats.activeUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Activity Rate</span>
                      <Badge variant="outline">
                        {((systemStats.activeUsers / systemStats.totalUsers) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage Usage</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>System Load</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant="default" className="bg-green-600">
                        Healthy
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="space-y-6">
            {/* User Filters */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={userItemsPerPage.toString()}
                    onValueChange={(value) => setUserItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {currentUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Users Found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      No users match your current filters. Try adjusting your search criteria.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">User Details</TableHead>
                            <TableHead className="font-semibold">Role & Status</TableHead>
                            <TableHead className="font-semibold">Activity</TableHead>
                            <TableHead className="font-semibold">Usage Stats</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentUsers.map((user, index) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-2">
                                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                                    {user.role}
                                  </Badge>
                                  <div>
                                    <Badge
                                      variant={user.isActive ? "default" : "secondary"}
                                      className={`text-xs ${
                                        user.isActive
                                          ? "bg-green-100 text-green-800 border-green-200"
                                          : "bg-red-100 text-red-800 border-red-200"
                                      }`}
                                    >
                                      {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="text-gray-600">Joined:</span> {formatDate(user.createdAt)}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Last Login:</span> {formatDate(user.lastLogin)}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="text-gray-600">Uploads:</span> {user.uploadsCount}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Charts:</span> {user.chartsCount}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Storage:</span> {formatFileSize(user.storageUsed)}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => setSelectedUser(user)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.isActive)}>
                                        <UserX className="h-4 w-4 mr-2" />
                                        {user.isActive ? "Deactivate" : "Activate"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={isDeletingUser === user.id}
                                        className="text-red-600"
                                      >
                                        {isDeletingUser === user.id ? (
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Delete User
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* User Pagination */}
                    {userTotalPages > 1 && (
                      <div className="flex items-center justify-between p-6 border-t">
                        <div className="text-sm text-gray-600">
                          Showing {userStartIndex + 1} to {Math.min(userEndIndex, filteredUsers.length)} of{" "}
                          {filteredUsers.length} users
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserCurrentPage(userCurrentPage - 1)}
                            disabled={userCurrentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, userTotalPages) }, (_, i) => {
                              const page = Math.max(1, Math.min(userTotalPages - 4, userCurrentPage - 2)) + i
                              return (
                                <Button
                                  key={page}
                                  variant={userCurrentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setUserCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserCurrentPage(userCurrentPage + 1)}
                            disabled={userCurrentPage === userTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads" className="mt-6">
          <div className="space-y-6">
            {/* Upload Filters */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search uploads by filename or user..."
                        value={uploadSearchTerm}
                        onChange={(e) => setUploadSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={uploadStatusFilter} onValueChange={setUploadStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={uploadDateFilter} onValueChange={setUploadDateFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={uploadItemsPerPage.toString()}
                    onValueChange={(value) => setUploadItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Uploads Table */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {currentUploads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileSpreadsheet className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Uploads Found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      No uploads match your current filters. Try adjusting your search criteria.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">File Details</TableHead>
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Upload Info</TableHead>
                            <TableHead className="font-semibold">Generated Content</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentUploads.map((upload, index) => (
                            <motion.tr
                              key={upload.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-sm">{upload.fileName}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatFileSize(upload.fileSize)} • {upload.totalRows.toLocaleString()} rows
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">{upload.userEmail}</div>
                                  <div className="text-xs text-gray-500">ID: {upload.userId.slice(0, 8)}...</div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(upload.uploadDate)}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="text-gray-600">Charts:</span> {upload.chartsGenerated}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">AI Summaries:</span> {upload.aiSummariesGenerated}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  className={`text-xs ${
                                    upload.status === "completed"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : upload.status === "processing"
                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                        : "bg-red-100 text-red-800 border-red-200"
                                  }`}
                                >
                                  {upload.status}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => setSelectedUpload(upload)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>

                                  <Button
                                    onClick={() => handleDeleteUpload(upload.id)}
                                    disabled={isDeletingUpload === upload.id}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-red-600 hover:text-red-700"
                                  >
                                    {isDeletingUpload === upload.id ? (
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 mr-1" />
                                    )}
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Upload Pagination */}
                    {uploadTotalPages > 1 && (
                      <div className="flex items-center justify-between p-6 border-t">
                        <div className="text-sm text-gray-600">
                          Showing {uploadStartIndex + 1} to {Math.min(uploadEndIndex, filteredUploads.length)} of{" "}
                          {filteredUploads.length} uploads
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadCurrentPage(uploadCurrentPage - 1)}
                            disabled={uploadCurrentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, uploadTotalPages) }, (_, i) => {
                              const page = Math.max(1, Math.min(uploadTotalPages - 4, uploadCurrentPage - 2)) + i
                              return (
                                <Button
                                  key={page}
                                  variant={uploadCurrentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setUploadCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadCurrentPage(uploadCurrentPage + 1)}
                            disabled={uploadCurrentPage === uploadTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Activity Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Daily Upload Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="uploads"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Content Generation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="charts" fill="#10b981" name="Charts" />
                        <Bar dataKey="aiSummaries" fill="#8b5cf6" name="AI Summaries" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    User Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="activeUsers"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-gray-600">45%</span>
                      </div>
                      <Progress value={45} className="h-3" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-gray-600">67%</span>
                      </div>
                      <Progress value={67} className="h-3" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Storage Usage</span>
                        <span className="text-sm text-gray-600">75%</span>
                      </div>
                      <Progress value={75} className="h-3" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Network I/O</span>
                        <span className="text-sm text-gray-600">32%</span>
                      </div>
                      <Progress value={32} className="h-3" />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">System Status</span>
                        <Badge variant="default" className="bg-green-600">
                          Healthy
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Details: {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Email</div>
                  <div className="text-lg">{selectedUser.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Role</div>
                  <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>{selectedUser.role}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Status</div>
                  <Badge
                    variant={selectedUser.isActive ? "default" : "secondary"}
                    className={
                      selectedUser.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Member Since</div>
                  <div className="text-lg">{formatDate(selectedUser.createdAt)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.uploadsCount}</div>
                  <div className="text-sm text-gray-600">Uploads</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedUser.chartsCount}</div>
                  <div className="text-sm text-gray-600">Charts</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedUser.aiSummariesCount}</div>
                  <div className="text-sm text-gray-600">AI Summaries</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatFileSize(selectedUser.storageUsed)}</div>
                  <div className="text-sm text-gray-600">Storage Used</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Details Modal */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Upload Details: {selectedUpload?.fileName}
            </DialogTitle>
          </DialogHeader>

          {selectedUpload && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">File Size</div>
                  <div className="text-lg">{formatFileSize(selectedUpload.fileSize)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Upload Date</div>
                  <div className="text-lg">{formatDate(selectedUpload.uploadDate)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Total Rows</div>
                  <div className="text-lg">{selectedUpload.totalRows.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Status</div>
                  <Badge
                    className={
                      selectedUpload.status === "completed"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : selectedUpload.status === "processing"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {selectedUpload.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-600">User Information</div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Email:</span> {selectedUpload.userEmail}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">User ID:</span> {selectedUpload.userId}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedUpload.chartsGenerated}</div>
                  <div className="text-sm text-gray-600">Charts Generated</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedUpload.aiSummariesGenerated}</div>
                  <div className="text-sm text-gray-600">AI Summaries</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
