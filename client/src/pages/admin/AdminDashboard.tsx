import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import {
  getPlatformStats,
  getAdminNotifications,
  getActivityLogs,
  markNotificationAsRead,
  type AdminNotification,
  type ActivityLog,
  type UserProfile,
} from "@/lib/firebase";
import {
  Users,
  UserCheck,
  UserX,
  Link2,
  Eye,
  MousePointer,
  Shield,
  Loader2,
  TrendingUp,
  TrendingDown,
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  FileText,
  Settings,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalLinks: number;
  totalViews: number;
  totalClicks: number;
  usersByPlan: { free: number; pro: number; business: number };
  recentUsers: UserProfile[];
  pendingReports: number;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"];

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading, isAdmin, permissions } = useFirebaseAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && (!userProfile || !isAdmin)) {
      setLocation("/dashboard");
    }
  }, [authLoading, userProfile, isAdmin, setLocation]);

  const fetchData = async () => {
    try {
      const [statsData, notifsData, logsData] = await Promise.all([
        getPlatformStats(),
        getAdminNotifications(10),
        getActivityLogs(10),
      ]);
      setStats(statsData);
      setNotifications(notifsData);
      setActivityLogs(logsData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error(isRTL ? "فشل في تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Prepare chart data
  const planChartData = stats ? [
    { name: "Free", value: stats.usersByPlan.free, color: "#3b82f6" },
    { name: "Pro", value: stats.usersByPlan.pro, color: "#8b5cf6" },
    { name: "Business", value: stats.usersByPlan.business, color: "#ec4899" },
  ] : [];

  const getNotificationIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "new_user":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case "new_report":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "user_suspended":
        return <UserX className="w-4 h-4 text-red-500" />;
      case "content_flagged":
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "لوحة الإدارة" : "Admin Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isRTL ? "نظرة عامة على المنصة والإحصائيات" : "Platform overview and statistics"}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {isRTL ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي المستخدمين" : "Total Users"}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.totalUsers || 0}</p>
                <span className="text-xs text-green-500 flex items-center font-medium">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +5%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "المستخدمين النشطين" : "Active Users"}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.activeUsers || 0}</p>
                <span className="text-xs text-muted-foreground">
                  {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Links */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي الروابط" : "Total Links"}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold">{stats?.totalLinks || 0}</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "التقارير المعلقة" : "Pending Reports"}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.pendingReports || 0}</p>
                {(stats?.pendingReports || 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {isRTL ? "يحتاج مراجعة" : "Needs Review"}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي المشاهدات" : "Total Views"}
            </CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي النقرات" : "Total Clicks"}
            </CardTitle>
            <MousePointer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold">{stats?.totalClicks?.toLocaleString() || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "الحسابات الموقوفة" : "Suspended Accounts"}
            </CardTitle>
            <UserX className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-red-500">{stats?.suspendedUsers || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Users by Plan Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {isRTL ? "المستخدمين حسب الخطة" : "Users by Plan"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "توزيع المستخدمين على الخطط المختلفة" : "Distribution of users across plans"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {planChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {isRTL ? "آخر الإشعارات" : "Recent Notifications"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "أحدث الأحداث في المنصة" : "Latest platform events"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/notifications")}>
              {isRTL ? "عرض الكل" : "View All"}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">{isRTL ? "لا توجد إشعارات" : "No notifications"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        !notification.read ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users and Activity */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {isRTL ? "أحدث المستخدمين" : "Recent Users"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "آخر المستخدمين المسجلين" : "Latest registered users"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/users")}>
              {isRTL ? "عرض الكل" : "View All"}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.recentUsers.map((user) => (
                    <div key={user.uid} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      </div>
                      <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-xs">
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {isRTL ? "سجل النشاط" : "Activity Log"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "آخر الإجراءات الإدارية" : "Recent admin actions"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">{isRTL ? "لا يوجد نشاط" : "No activity"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.adminUsername}</span>
                          {" "}
                          <span className="text-muted-foreground">{log.action}</span>
                        </p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {isRTL ? "إجراءات سريعة" : "Quick Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setLocation("/admin/users")}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs sm:text-sm">{isRTL ? "إدارة المستخدمين" : "Manage Users"}</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setLocation("/admin/analytics")}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs sm:text-sm">{isRTL ? "التحليلات" : "Analytics"}</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setLocation("/admin/content")}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs sm:text-sm">{isRTL ? "إدارة المحتوى" : "Content"}</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setLocation("/admin/settings")}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs sm:text-sm">{isRTL ? "الإعدادات" : "Settings"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
