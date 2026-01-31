import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import {
  getAllReports,
  getAllLinks,
  updateReportStatus,
  deleteLinkByAdmin,
  getUnsafeLinkReports,
  updateUnsafeLinkReportStatus,
  type Report,
  type Link as LinkType,
} from "@/lib/firebase";
import {
  FileText,
  AlertTriangle,
  Link2,
  Search,
  Loader2,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  RefreshCw,
  Filter,
  Clock,
  Shield,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

export default function AdminContent() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading, isAdmin } = useFirebaseAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedLink, setSelectedLink] = useState<LinkType | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [processing, setProcessing] = useState(false);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && (!userProfile || !isAdmin)) {
      setLocation("/dashboard");
    }
  }, [authLoading, userProfile, isAdmin, setLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, linksData] = await Promise.all([
        getAllReports(),
        getAllLinks(),
      ]);
      setReports(reportsData);
      setLinks(linksData);
    } catch (error) {
      console.error("Error fetching data:", error);
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

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      !searchQuery ||
      report.linkTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedUsername?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter links
  const filteredLinks = links.filter((link) => {
    return (
      !searchQuery ||
      link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleReviewReport = async (status: Report["status"]) => {
    if (!selectedReport || !userProfile) return;

    setProcessing(true);
    try {
      await updateReportStatus(selectedReport.id, status, userProfile.uid, resolution);
      setReports(reports.map((r) =>
        r.id === selectedReport.id ? { ...r, status, resolution } : r
      ));
      toast.success(isRTL ? "تم تحديث حالة التقرير" : "Report status updated");
      setReviewDialogOpen(false);
      setSelectedReport(null);
      setResolution("");
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(isRTL ? "فشل في تحديث التقرير" : "Failed to update report");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedLink || !userProfile) return;

    setProcessing(true);
    try {
      await deleteLinkByAdmin(selectedLink.id, userProfile.uid, "Violated content policy");
      setLinks(links.filter((l) => l.id !== selectedLink.id));
      toast.success(isRTL ? "تم حذف الرابط" : "Link deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedLink(null);
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error(isRTL ? "فشل في حذف الرابط" : "Failed to delete link");
    } finally {
      setProcessing(false);
    }
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

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />{isRTL ? "معلق" : "Pending"}</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="border-blue-500 text-blue-600"><Eye className="w-3 h-3 mr-1" />{isRTL ? "تمت المراجعة" : "Reviewed"}</Badge>;
      case "resolved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{isRTL ? "تم الحل" : "Resolved"}</Badge>;
      case "dismissed":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />{isRTL ? "مرفوض" : "Dismissed"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: Report["reason"]) => {
    const colors: Record<string, string> = {
      spam: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      inappropriate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      malware: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      phishing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    const labels: Record<string, { en: string; ar: string }> = {
      spam: { en: "Spam", ar: "سبام" },
      inappropriate: { en: "Inappropriate", ar: "غير لائق" },
      malware: { en: "Malware", ar: "برمجيات خبيثة" },
      phishing: { en: "Phishing", ar: "تصيد" },
      other: { en: "Other", ar: "أخرى" },
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[reason] || colors.other}`}>
        {isRTL ? labels[reason]?.ar : labels[reason]?.en || reason}
      </span>
    );
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "إدارة المحتوى" : "Content Management"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isRTL ? "مراجعة التقارير وإدارة المحتوى المخالف" : "Review reports and manage violating content"}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي التقارير" : "Total Reports"}
            </CardTitle>
            <Flag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{reports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "معلقة" : "Pending"}
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {reports.filter((r) => r.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "تم الحل" : "Resolved"}
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {reports.filter((r) => r.status === "resolved").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isRTL ? "إجمالي الروابط" : "Total Links"}
            </CardTitle>
            <Link2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{links.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reports" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isRTL ? "التقارير" : "Reports"}
            {reports.filter((r) => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {reports.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="w-4 h-4" />
            {isRTL ? "الروابط" : "Links"}
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={isRTL ? "بحث في التقارير..." : "Search reports..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isRTL ? "pr-10" : "pl-10"}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={isRTL ? "الحالة" : "Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "جميع الحالات" : "All Status"}</SelectItem>
                    <SelectItem value="pending">{isRTL ? "معلق" : "Pending"}</SelectItem>
                    <SelectItem value="reviewed">{isRTL ? "تمت المراجعة" : "Reviewed"}</SelectItem>
                    <SelectItem value="resolved">{isRTL ? "تم الحل" : "Resolved"}</SelectItem>
                    <SelectItem value="dismissed">{isRTL ? "مرفوض" : "Dismissed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isRTL ? "لا توجد تقارير" : "No reports found"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? "الرابط" : "Link"}</TableHead>
                        <TableHead className="hidden sm:table-cell">{isRTL ? "المبلغ عنه" : "Reported User"}</TableHead>
                        <TableHead>{isRTL ? "السبب" : "Reason"}</TableHead>
                        <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="hidden md:table-cell">{isRTL ? "التاريخ" : "Date"}</TableHead>
                        <TableHead className="text-right">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm truncate max-w-[200px]">{report.linkTitle}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{report.linkUrl}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm">@{report.reportedUsername}</span>
                          </TableCell>
                          <TableCell>{getReasonBadge(report.reason)}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</span>
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
                                <DropdownMenuItem onClick={() => window.open(report.linkUrl, "_blank")}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {isRTL ? "فتح الرابط" : "Open Link"}
                                </DropdownMenuItem>
                                {report.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedReport(report);
                                        setReviewDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      {isRTL ? "مراجعة" : "Review"}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  placeholder={isRTL ? "بحث في الروابط..." : "Search links..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isRTL ? "pr-10" : "pl-10"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Links Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="text-center py-12">
                  <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isRTL ? "لا توجد روابط" : "No links found"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                        <TableHead className="hidden sm:table-cell">{isRTL ? "الرابط" : "URL"}</TableHead>
                        <TableHead>{isRTL ? "النقرات" : "Clicks"}</TableHead>
                        <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-right">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLinks.slice(0, 50).map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <p className="font-medium text-sm truncate max-w-[200px]">{link.title}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">{link.url}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{link.clicks || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={link.enabled ? "default" : "secondary"}>
                              {link.enabled ? (isRTL ? "مفعل" : "Active") : (isRTL ? "معطل" : "Disabled")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"}>
                                <DropdownMenuItem onClick={() => window.open(link.url, "_blank")}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {isRTL ? "فتح الرابط" : "Open Link"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLink(link);
                                    setDeleteDialogOpen(true);
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Report Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRTL ? "مراجعة التقرير" : "Review Report"}</DialogTitle>
            <DialogDescription>
              {isRTL ? "اتخذ إجراء بشأن هذا التقرير" : "Take action on this report"}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedReport.linkTitle}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedReport.linkUrl}</p>
                <div className="flex gap-2 mt-2">
                  {getReasonBadge(selectedReport.reason)}
                </div>
                {selectedReport.description && (
                  <p className="text-sm mt-2 text-muted-foreground">{selectedReport.description}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">{isRTL ? "ملاحظات (اختياري)" : "Resolution Notes (optional)"}</label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder={isRTL ? "أضف ملاحظات..." : "Add notes..."}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleReviewReport("dismissed")}
              disabled={processing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {isRTL ? "رفض" : "Dismiss"}
            </Button>
            <Button
              onClick={() => handleReviewReport("resolved")}
              disabled={processing}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              {isRTL ? "حل" : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Link Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "حذف الرابط" : "Delete Link"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `هل أنت متأكد من حذف "${selectedLink?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${selectedLink?.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              disabled={processing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRTL ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
