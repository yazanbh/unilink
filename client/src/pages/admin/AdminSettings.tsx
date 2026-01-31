import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import {
  getSystemSettings,
  updateSystemSettings,
  getActivityLogs,
  type SystemSettings,
  type ActivityLog,
} from "@/lib/firebase";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Loader2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  Server,
  Mail,
  Users,
  Lock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

export default function AdminSettings() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading, isAdmin, isSuperAdmin } = useFirebaseAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && (!userProfile || !isAdmin)) {
      setLocation("/dashboard");
    }
  }, [authLoading, userProfile, isAdmin, setLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsData, logsData] = await Promise.all([
        getSystemSettings(),
        getActivityLogs(50),
      ]);
      setSettings(settingsData);
      setActivityLogs(logsData);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error(isRTL ? "فشل في تحميل الإعدادات" : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings || !userProfile) return;

    setSaving(true);
    try {
      await updateSystemSettings(settings, userProfile.uid);
      toast.success(isRTL ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(isRTL ? "فشل في حفظ الإعدادات" : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "-";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "إعدادات النظام" : "System Settings"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isRTL ? "إدارة إعدادات المنصة والنظام" : "Manage platform and system settings"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
              ) : (
                <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              )}
              {isRTL ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="general" className="gap-1 text-xs sm:text-sm">
            <Globe className="w-4 h-4 hidden sm:block" />
            {isRTL ? "عام" : "General"}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1 text-xs sm:text-sm">
            <Lock className="w-4 h-4 hidden sm:block" />
            {isRTL ? "الأمان" : "Security"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 text-xs sm:text-sm">
            <Bell className="w-4 h-4 hidden sm:block" />
            {isRTL ? "الإشعارات" : "Notifications"}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1 text-xs sm:text-sm">
            <Activity className="w-4 h-4 hidden sm:block" />
            {isRTL ? "السجلات" : "Logs"}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {isRTL ? "الإعدادات العامة" : "General Settings"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "إعدادات الموقع الأساسية" : "Basic site settings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="siteName">{isRTL ? "اسم الموقع" : "Site Name"}</Label>
                    <Input
                      id="siteName"
                      value={settings?.siteName || ""}
                      onChange={(e) => handleSettingChange("siteName", e.target.value)}
                      placeholder="UniLink"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">{isRTL ? "وصف الموقع" : "Site Description"}</Label>
                    <Textarea
                      id="siteDescription"
                      value={settings?.siteDescription || ""}
                      onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                      placeholder={isRTL ? "وصف قصير للموقع..." : "A short description of your site..."}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLinks">{isRTL ? "الحد الأقصى للروابط لكل مستخدم" : "Max Links per User"}</Label>
                    <Input
                      id="maxLinks"
                      type="number"
                      value={settings?.maxLinksPerUser || 50}
                      onChange={(e) => handleSettingChange("maxLinksPerUser", parseInt(e.target.value))}
                      min={1}
                      max={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? "عدد الروابط المسموح بها لكل مستخدم" : "Number of links allowed per user"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultPlan">{isRTL ? "الخطة الافتراضية للمستخدمين الجدد" : "Default Plan for New Users"}</Label>
                    <Select
                      value={settings?.defaultUserPlan || "free"}
                      onValueChange={(value) => handleSettingChange("defaultUserPlan", value)}
                    >
                      <SelectTrigger id="defaultPlan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">{isRTL ? "مجاني" : "Free"}</SelectItem>
                        <SelectItem value="pro">{isRTL ? "برو" : "Pro"}</SelectItem>
                        <SelectItem value="business">{isRTL ? "بيزنس" : "Business"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {isRTL ? "إعدادات الأمان" : "Security Settings"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "إدارة إعدادات الأمان والوصول" : "Manage security and access settings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{isRTL ? "وضع الصيانة" : "Maintenance Mode"}</Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "تعطيل الموقع مؤقتاً للصيانة" : "Temporarily disable the site for maintenance"}
                      </p>
                    </div>
                    <Switch
                      checked={settings?.maintenanceMode || false}
                      onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{isRTL ? "السماح بالتسجيل" : "Allow Registration"}</Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "السماح للمستخدمين الجدد بالتسجيل" : "Allow new users to register"}
                      </p>
                    </div>
                    <Switch
                      checked={settings?.allowRegistration !== false}
                      onCheckedChange={(checked) => handleSettingChange("allowRegistration", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{isRTL ? "المراقبة التلقائية" : "Auto Moderation"}</Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "فحص المحتوى تلقائياً للكشف عن المخالفات" : "Automatically scan content for violations"}
                      </p>
                    </div>
                    <Switch
                      checked={settings?.autoModeration || false}
                      onCheckedChange={(checked) => handleSettingChange("autoModeration", checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Admin Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {isRTL ? "معلومات المسؤول" : "Admin Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{userProfile?.displayName || userProfile?.username}</p>
                    <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                  </div>
                  <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                    {isSuperAdmin ? (isRTL ? "مسؤول أعلى" : "Super Admin") : (isRTL ? "مسؤول" : "Admin")}
                  </Badge>
                </div>
                {!isSuperAdmin && (
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {isRTL ? "صلاحيات محدودة" : "Limited Permissions"}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          {isRTL
                            ? "بعض الإعدادات قد تتطلب صلاحيات مسؤول أعلى"
                            : "Some settings may require super admin privileges"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {isRTL ? "إعدادات الإشعارات" : "Notification Settings"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "إدارة إشعارات النظام والبريد الإلكتروني" : "Manage system and email notifications"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {isRTL ? "إشعارات البريد الإلكتروني" : "Email Notifications"}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "إرسال إشعارات عبر البريد الإلكتروني" : "Send notifications via email"}
                      </p>
                    </div>
                    <Switch
                      checked={settings?.emailNotifications !== false}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-3">{isRTL ? "أنواع الإشعارات" : "Notification Types"}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{isRTL ? "مستخدم جديد" : "New User Registration"}</span>
                        <Badge variant="default">{isRTL ? "مفعل" : "Enabled"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{isRTL ? "تقرير جديد" : "New Report"}</span>
                        <Badge variant="default">{isRTL ? "مفعل" : "Enabled"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{isRTL ? "تعليق مستخدم" : "User Suspended"}</span>
                        <Badge variant="default">{isRTL ? "مفعل" : "Enabled"}</Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {isRTL ? "سجل النشاط" : "Activity Log"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "سجل جميع الإجراءات الإدارية" : "Log of all administrative actions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
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
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isRTL ? "لا يوجد نشاط مسجل" : "No activity logged"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{log.adminUsername}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.action}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {log.targetType}
                            </Badge>
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">{log.details}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
