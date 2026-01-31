import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import {
  getPlatformStats,
  getAllUsers,
  getAllLinks,
  type UserProfile,
  type Link as LinkType,
} from "@/lib/firebase";
import {
  Users,
  Link2,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  RefreshCw,
  Calendar,
  Activity,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
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
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Timestamp } from "firebase/firestore";

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

const COLORS = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  green: "#22c55e",
  orange: "#f97316",
  cyan: "#06b6d4",
};

export default function AdminAnalytics() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading, isAdmin } = useFirebaseAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && (!userProfile || !isAdmin)) {
      setLocation("/dashboard");
    }
  }, [authLoading, userProfile, isAdmin, setLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, linksData] = await Promise.all([
        getPlatformStats(),
        getAllUsers(),
        getAllLinks(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setLinks(linksData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error(isRTL ? "فشل في تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Calculate user growth data
  const getUserGrowthData = () => {
    const days = parseInt(timeRange);
    const now = new Date();
    const data: { date: string; users: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
      
      const usersUpToDate = users.filter((u) => {
        const createdAt = u.createdAt instanceof Timestamp ? u.createdAt.toDate() : new Date(u.createdAt);
        return createdAt <= date;
      }).length;

      data.push({ date: dateStr, users: usersUpToDate });
    }

    return data;
  };

  // Calculate links per user
  const getLinksPerUserData = () => {
    const linkCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    users.forEach((user) => {
      const userLinks = links.filter((l) => l.uid === user.uid).length;
      const bucket = Math.min(userLinks, 5);
      linkCounts[bucket] = (linkCounts[bucket] || 0) + 1;
    });

    return [
      { name: "0", value: linkCounts[0], fill: COLORS.blue },
      { name: "1", value: linkCounts[1], fill: COLORS.purple },
      { name: "2", value: linkCounts[2], fill: COLORS.pink },
      { name: "3", value: linkCounts[3], fill: COLORS.green },
      { name: "4", value: linkCounts[4], fill: COLORS.orange },
      { name: "5+", value: linkCounts[5], fill: COLORS.cyan },
    ];
  };

  // Plan distribution
  const planData = stats ? [
    { name: isRTL ? "مجاني" : "Free", value: stats.usersByPlan.free, fill: COLORS.blue },
    { name: isRTL ? "برو" : "Pro", value: stats.usersByPlan.pro, fill: COLORS.purple },
    { name: isRTL ? "بيزنس" : "Business", value: stats.usersByPlan.business, fill: COLORS.pink },
  ] : [];

  // Top links by clicks
  const topLinks = [...links]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 10);

  // Calculate metrics
  const avgLinksPerUser = users.length > 0 ? (links.length / users.length).toFixed(1) : "0";
  const avgClicksPerLink = links.length > 0 ? (stats?.totalClicks || 0 / links.length).toFixed(1) : "0";
  const ctr = stats && stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : "0";

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "تحليلات المنصة" : "Platform Analytics"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isRTL ? "إحصائيات وتحليلات شاملة للمنصة" : "Comprehensive platform statistics and analytics"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{isRTL ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
              <SelectItem value="30">{isRTL ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
              <SelectItem value="90">{isRTL ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي المشاهدات" : "Total Views"}
            </CardTitle>
            <Eye className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</p>
                <span className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  12%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي النقرات" : "Total Clicks"}
            </CardTitle>
            <MousePointer className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.totalClicks?.toLocaleString() || 0}</p>
                <span className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  8%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "معدل النقر" : "Click Rate"}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold">{ctr}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "متوسط الروابط/مستخدم" : "Avg Links/User"}
            </CardTitle>
            <Link2 className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold">{avgLinksPerUser}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {isRTL ? "نمو المستخدمين" : "User Growth"}
            </CardTitle>
            <CardDescription>
              {isRTL ? `آخر ${timeRange} يوم` : `Last ${timeRange} days`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getUserGrowthData()}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke={COLORS.blue}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              {isRTL ? "توزيع الخطط" : "Plan Distribution"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "توزيع المستخدمين على الخطط" : "User distribution across plans"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="w-48 h-48 rounded-full" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Links per User */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {isRTL ? "عدد الروابط لكل مستخدم" : "Links per User"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "توزيع عدد الروابط بين المستخدمين" : "Distribution of links among users"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getLinksPerUserData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {getLinksPerUserData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {isRTL ? "أكثر الروابط نقراً" : "Top Links by Clicks"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "الروابط الأكثر شعبية" : "Most popular links"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{isRTL ? "لا توجد روابط" : "No links yet"}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {topLinks.map((link, index) => (
                  <div key={link.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <Badge variant="secondary">{link.clicks || 0}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {isRTL ? "ملخص الإحصائيات" : "Statistics Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRTL ? "مستخدم" : "Users"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-purple-600">{stats?.totalLinks || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRTL ? "رابط" : "Links"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRTL ? "نشط" : "Active"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-red-600">{stats?.suspendedUsers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRTL ? "موقوف" : "Suspended"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-orange-600">{stats?.usersByPlan.pro || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRTL ? "برو" : "Pro Users"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-pink-600">{stats?.usersByPlan.business || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRTL ? "بيزنس" : "Business"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
