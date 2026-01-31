import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import {
  getAllUsers,
  suspendUser,
  activateUser,
  deleteUser,
  setUserRole,
  updateUserPlan,
  exportUsersToCSV,
  type UserProfile,
} from "@/lib/firebase";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Shield,
  Loader2,
  MoreVertical,
  Trash2,
  Ban,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  Crown,
  UserCog,
  ExternalLink,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

const ITEMS_PER_PAGE = 10;

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading, isAdmin, isSuperAdmin } = useFirebaseAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "delete" | "makeAdmin" | "removeAdmin" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && (!userProfile || !isAdmin)) {
      setLocation("/dashboard");
    }
  }, [authLoading, userProfile, isAdmin, setLocation]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(isRTL ? "فشل في تحميل المستخدمين" : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Apply filters
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Plan filter
    if (planFilter !== "all") {
      result = result.filter((u) => u.plan === planFilter);
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, roleFilter, planFilter, users]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setProcessing(true);
    try {
      switch (actionType) {
        case "suspend":
          await suspendUser(selectedUser.uid, userProfile?.uid);
          setUsers(users.map((u) =>
            u.uid === selectedUser.uid ? { ...u, status: "suspended" as const } : u
          ));
          toast.success(isRTL ? "تم إيقاف المستخدم بنجاح" : "User suspended successfully");
          break;

        case "activate":
          await activateUser(selectedUser.uid, userProfile?.uid);
          setUsers(users.map((u) =>
            u.uid === selectedUser.uid ? { ...u, status: "active" as const } : u
          ));
          toast.success(isRTL ? "تم تفعيل المستخدم بنجاح" : "User activated successfully");
          break;

        case "delete":
          await deleteUser(selectedUser.uid, userProfile?.uid);
          setUsers(users.filter((u) => u.uid !== selectedUser.uid));
          toast.success(isRTL ? "تم حذف المستخدم بنجاح" : "User deleted successfully");
          break;

        case "makeAdmin":
          await setUserRole(selectedUser.uid, "admin", userProfile?.uid);
          setUsers(users.map((u) =>
            u.uid === selectedUser.uid ? { ...u, role: "admin" as const } : u
          ));
          toast.success(isRTL ? "تم ترقية المستخدم لمسؤول" : "User promoted to admin");
          break;

        case "removeAdmin":
          await setUserRole(selectedUser.uid, "user", userProfile?.uid);
          setUsers(users.map((u) =>
            u.uid === selectedUser.uid ? { ...u, role: "user" as const } : u
          ));
          toast.success(isRTL ? "تم إزالة صلاحيات المسؤول" : "Admin privileges removed");
          break;
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(isRTL ? "فشل في تنفيذ الإجراء" : "Failed to perform action");
    } finally {
      setProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleExport = () => {
    const csv = exportUsersToCSV(filteredUsers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success(isRTL ? "تم تصدير البيانات بنجاح" : "Data exported successfully");
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "-";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case "suspend":
        return {
          title: isRTL ? "تعليق المستخدم" : "Suspend User",
          description: isRTL
            ? `هل أنت متأكد من تعليق حساب "${selectedUser?.username}"؟`
            : `Are you sure you want to suspend "${selectedUser?.username}"?`,
        };
      case "activate":
        return {
          title: isRTL ? "تفعيل المستخدم" : "Activate User",
          description: isRTL
            ? `هل أنت متأكد من تفعيل حساب "${selectedUser?.username}"؟`
            : `Are you sure you want to activate "${selectedUser?.username}"?`,
        };
      case "delete":
        return {
          title: isRTL ? "حذف المستخدم" : "Delete User",
          description: isRTL
            ? `هل أنت متأكد من حذف حساب "${selectedUser?.username}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${selectedUser?.username}"? This action cannot be undone.`,
        };
      case "makeAdmin":
        return {
          title: isRTL ? "ترقية لمسؤول" : "Promote to Admin",
          description: isRTL
            ? `هل أنت متأكد من ترقية "${selectedUser?.username}" لمسؤول؟`
            : `Are you sure you want to promote "${selectedUser?.username}" to admin?`,
        };
      case "removeAdmin":
        return {
          title: isRTL ? "إزالة صلاحيات المسؤول" : "Remove Admin",
          description: isRTL
            ? `هل أنت متأكد من إزالة صلاحيات المسؤول من "${selectedUser?.username}"؟`
            : `Are you sure you want to remove admin privileges from "${selectedUser?.username}"?`,
        };
      default:
        return { title: "", description: "" };
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "إدارة المستخدمين" : "User Management"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isRTL ? "إدارة وعرض جميع المستخدمين المسجلين" : "Manage and view all registered users"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
          <Button onClick={handleExport} disabled={filteredUsers.length === 0}>
            <Download className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? "تصدير CSV" : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي المستخدمين" : "Total Users"}
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "نشط" : "Active"}
            </CardTitle>
            <UserCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "موقوف" : "Suspended"}
            </CardTitle>
            <UserX className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {users.filter((u) => u.status === "suspended").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "المسؤولين" : "Admins"}
            </CardTitle>
            <Shield className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === "admin" || u.role === "superadmin").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {isRTL ? "الفلاتر" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={isRTL ? "بحث عن مستخدم..." : "Search users..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "جميع الحالات" : "All Status"}</SelectItem>
                <SelectItem value="active">{isRTL ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="suspended">{isRTL ? "موقوف" : "Suspended"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "الدور" : "Role"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "جميع الأدوار" : "All Roles"}</SelectItem>
                <SelectItem value="user">{isRTL ? "مستخدم" : "User"}</SelectItem>
                <SelectItem value="admin">{isRTL ? "مسؤول" : "Admin"}</SelectItem>
                <SelectItem value="superadmin">{isRTL ? "مسؤول أعلى" : "Super Admin"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Plan Filter */}
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "الخطة" : "Plan"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "جميع الخطط" : "All Plans"}</SelectItem>
                <SelectItem value="free">{isRTL ? "مجاني" : "Free"}</SelectItem>
                <SelectItem value="pro">{isRTL ? "برو" : "Pro"}</SelectItem>
                <SelectItem value="business">{isRTL ? "بيزنس" : "Business"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {isRTL ? "قائمة المستخدمين" : "Users List"}
            <Badge variant="secondary" className="ml-2">
              {filteredUsers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? "لا يوجد مستخدمين" : "No users found"}
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "المستخدم" : "User"}</TableHead>
                      <TableHead className="hidden sm:table-cell">{isRTL ? "البريد" : "Email"}</TableHead>
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="hidden md:table-cell">{isRTL ? "الدور" : "Role"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{isRTL ? "الخطة" : "Plan"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{isRTL ? "تاريخ التسجيل" : "Joined"}</TableHead>
                      <TableHead className="text-right">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                                {user.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.displayName || user.username}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "destructive"}>
                            {user.status === "active" ? (isRTL ? "نشط" : "Active") : (isRTL ? "موقوف" : "Suspended")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={user.role !== "user" ? "border-purple-500 text-purple-600" : ""}>
                            {user.role === "superadmin" ? (isRTL ? "مسؤول أعلى" : "Super Admin") :
                             user.role === "admin" ? (isRTL ? "مسؤول" : "Admin") : (isRTL ? "مستخدم" : "User")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary">
                            {user.plan === "business" ? "Business" : user.plan === "pro" ? "Pro" : "Free"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? "start" : "end"}>
                              <DropdownMenuLabel>{isRTL ? "إجراءات" : "Actions"}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(`/${user.username}`, "_blank")}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {isRTL ? "عرض الملف" : "View Profile"}
                              </DropdownMenuItem>
                              {user.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionType("suspend");
                                  }}
                                  className="text-orange-600"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  {isRTL ? "تعليق" : "Suspend"}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionType("activate");
                                  }}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {isRTL ? "تفعيل" : "Activate"}
                                </DropdownMenuItem>
                              )}
                              {isSuperAdmin && user.role !== "superadmin" && (
                                <>
                                  <DropdownMenuSeparator />
                                  {user.role === "user" ? (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setActionType("makeAdmin");
                                      }}
                                      className="text-purple-600"
                                    >
                                      <Crown className="w-4 h-4 mr-2" />
                                      {isRTL ? "ترقية لمسؤول" : "Make Admin"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setActionType("removeAdmin");
                                      }}
                                    >
                                      <UserCog className="w-4 h-4 mr-2" />
                                      {isRTL ? "إزالة صلاحيات المسؤول" : "Remove Admin"}
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("delete");
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isRTL ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? `عرض ${(currentPage - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} من ${filteredUsers.length}`
                      : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of ${filteredUsers.length}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionDialogContent().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDialogContent().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={actionType === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRTL ? "تأكيد" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
