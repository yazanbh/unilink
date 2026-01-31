import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { getUserLinks, getAnalytics, type Link as LinkType, type Analytics } from "@/lib/firebase";
import {
  Eye,
  MousePointerClick,
  LinkIcon,
  User,
  BarChart3,
  ExternalLink,
  Loader2,
  TrendingUp,
  Plus,
  Sparkles,
  Copy,
  Check,
  Zap,
  Crown,
  Palette,
  Share2,
  ArrowUpRight,
  Clock,
  Target,
  Wand2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
} as const;

const statsCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
    },
  },
} as const;

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading } = useFirebaseAuth();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && !userProfile) {
      setLocation("/login");
    }
  }, [authLoading, userProfile, setLocation]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;
      
      try {
        const [userLinks, userAnalytics] = await Promise.all([
          getUserLinks(userProfile.uid),
          getAnalytics(userProfile.uid),
        ]);
        setLinks(userLinks);
        setAnalytics(userAnalytics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLinks([]);
        setAnalytics({ uid: userProfile.uid, views: 0, clicks: {}, updatedAt: new Date() });
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const ctr = analytics?.views ? ((totalClicks / analytics.views) * 100).toFixed(1) : "0";
  const topLinks = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
  const activeLinks = links.filter(l => l.enabled).length;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${userProfile?.username}`);
    setCopied(true);
    toast.success(isRTL ? "تم نسخ الرابط!" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate profile completion
  const getProfileCompletion = () => {
    let score = 0;
    if (userProfile?.displayName) score += 20;
    if (userProfile?.bio) score += 20;
    if (userProfile?.photoURL) score += 20;
    if (links.length > 0) score += 20;
    if (userProfile?.themeId && userProfile.themeId !== "default") score += 20;
    return score;
  };

  const profileCompletion = getProfileCompletion();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header with Gradient Background */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse-slow" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("dashboard.welcome")}, {userProfile.displayName || userProfile.username}!
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </motion.h1>
            <p className="text-white/80 mt-2 text-lg">
              {isRTL ? "إليك نظرة عامة على أداء ملفك الشخصي اليوم." : "Here's an overview of your profile performance today."}
            </p>
            
            {/* Quick Stats in Header */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Eye className="w-4 h-4" />
                <span className="font-semibold">{analytics?.views || 0}</span>
                <span className="text-white/70 text-sm">{isRTL ? "مشاهدة" : "views"}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <MousePointerClick className="w-4 h-4" />
                <span className="font-semibold">{totalClicks}</span>
                <span className="text-white/70 text-sm">{isRTL ? "نقرة" : "clicks"}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <LinkIcon className="w-4 h-4" />
                <span className="font-semibold">{activeLinks}/{links.length}</span>
                <span className="text-white/70 text-sm">{isRTL ? "رابط نشط" : "active"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              onClick={() => window.open(`/${userProfile.username}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 me-2" />
              {isRTL ? "عرض الملف" : "View Profile"}
            </Button>
            <Button
              className="bg-white text-purple-600 hover:bg-white/90"
              onClick={() => setLocation("/dashboard/links")}
            >
              <Plus className="w-4 h-4 me-2" />
              {isRTL ? "إضافة رابط" : "Add Link"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Profile Completion Card */}
      {profileCompletion < 100 && (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isRTL ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {isRTL 
                        ? `ملفك مكتمل بنسبة ${profileCompletion}% - أكمله لتحصل على نتائج أفضل!`
                        : `Your profile is ${profileCompletion}% complete - finish it for better results!`}
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Progress value={profileCompletion} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={statsCardVariants} whileHover="hover">
          <Card className="relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalLinks")}
              </CardTitle>
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                whileHover={{ rotate: 10 }}
              >
                <LinkIcon className="w-6 h-6 text-white" />
              </motion.div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold">{links.length}</p>
                  <span className="text-sm text-muted-foreground mb-1">
                    {isRTL ? "رابط" : "links"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statsCardVariants} whileHover="hover">
          <Card className="relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalViews")}
              </CardTitle>
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
                whileHover={{ rotate: 10 }}
              >
                <Eye className="w-6 h-6 text-white" />
              </motion.div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold">{analytics?.views || 0}</p>
                  <span className="text-sm text-green-500 flex items-center mb-1">
                    <ArrowUpRight className="w-4 h-4" />
                    12%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statsCardVariants} whileHover="hover">
          <Card className="relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalClicks")}
              </CardTitle>
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30"
                whileHover={{ rotate: 10 }}
              >
                <MousePointerClick className="w-6 h-6 text-white" />
              </motion.div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold">{totalClicks}</p>
                  <span className="text-sm text-green-500 flex items-center mb-1">
                    <ArrowUpRight className="w-4 h-4" />
                    8%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statsCardVariants} whileHover="hover">
          <Card className="relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRTL ? "معدل النقر" : "Click Rate"}
              </CardTitle>
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30"
                whileHover={{ rotate: 10 }}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </motion.div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold">{ctr}%</p>
                  <span className="text-sm text-muted-foreground mb-1">CTR</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Top Links */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions - Modern Grid */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t("dashboard.quickActions")}
              </CardTitle>
              <CardDescription>
                {isRTL ? "الوصول السريع لأهم الميزات" : "Quick access to important features"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/dashboard/links")}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-5 text-start transition-all hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                    <LinkIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{t("dashboard.manageLinks")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRTL ? "إضافة وتعديل الروابط" : "Add and edit links"}
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/dashboard/analytics")}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 p-5 text-start transition-all hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{t("dashboard.viewAnalytics")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRTL ? "تتبع الأداء" : "Track performance"}
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/dashboard/profile")}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 p-5 text-start transition-all hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 shadow-lg shadow-green-500/30">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{isRTL ? "تخصيص المظهر" : "Customize"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRTL ? "غير ثيم صفحتك" : "Change your theme"}
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/dashboard/subscriptions")}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/50 dark:to-orange-900/30 p-5 text-start transition-all hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/30">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{isRTL ? "ترقية الحساب" : "Upgrade"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRTL ? "احصل على مزايا أكثر" : "Get more features"}
                  </p>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Links */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  {isRTL ? "أفضل الروابط أداءً" : "Top Performing Links"}
                </CardTitle>
                <CardDescription>
                  {isRTL ? "الروابط الأكثر نقراً" : "Your most clicked links"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/links")}>
                {isRTL ? "عرض الكل" : "View All"}
                <ArrowUpRight className="w-4 h-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : topLinks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <LinkIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">{t("links.noLinks")}</p>
                  <Button
                    onClick={() => setLocation("/dashboard/links")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Plus className="w-4 h-4 me-2" />
                    {t("links.addLink")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {topLinks.map((link, index) => {
                    const percentage = totalClicks > 0 ? ((link.clicks || 0) / totalClicks) * 100 : 0;
                    return (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-xl bg-muted/50 p-4 hover:bg-muted transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white
                              ${index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                                index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                                index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                                "bg-gradient-to-br from-blue-500 to-blue-600"}
                            `}>
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[180px]">{link.title}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="font-bold text-lg">{link.clicks || 0}</p>
                            <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Feature Promo */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 border-purple-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
          <CardContent className="py-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Wand2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {isRTL ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full">
                      {isRTL ? "جديد" : "NEW"}
                    </span>
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {isRTL 
                      ? "دع الذكاء الاصطناعي يساعدك في كتابة سيرة ذاتية جذابة وعناوين روابط مميزة"
                      : "Let AI help you write an engaging bio and compelling link titles"}
                  </p>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                onClick={() => setLocation("/dashboard/profile")}
              >
                <Sparkles className="w-4 h-4 me-2" />
                {isRTL ? "جرب الآن" : "Try Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Link - Modern Design */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5" />
          <CardContent className="py-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {isRTL ? "رابط ملفك الشخصي" : "Your Profile Link"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isRTL ? "شارك هذا الرابط مع جمهورك" : "Share this link with your audience"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 border">
                  <code className="text-sm font-mono">
                    {window.location.origin}/{userProfile.username}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={copyProfileLink}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => window.open(`/${userProfile.username}`, "_blank")}
                >
                  <ExternalLink className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
