import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import {
  getUserLinks,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
  type Link as LinkType,
} from "@/lib/firebase";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  LinkIcon,
  ExternalLink,
  MoreVertical,
  Copy,
  BarChart3,
  Zap,
  Sparkles,
  Wand2,
  MousePointerClick,
  Eye,
  Clock,
  Smartphone,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import SmartLinkSettings, { type SmartLinkConditions } from "@/components/SmartLinkSettings";
import { LinkScannerDialog, LinkScannerInline, BulkLinkScanner } from "@/components/LinkScanner";
import { checkLinkSafety, type LinkScanResult } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100 },
  },
} as const;

interface SortableLinkItemProps {
  link: LinkType;
  onEdit: (link: LinkType) => void;
  onDelete: (link: LinkType) => void;
  onToggle: (link: LinkType, enabled: boolean) => void;
  onDuplicate: (link: LinkType) => void;
  isRTL: boolean;
}

function SortableLinkItem({ link, onEdit, onDelete, onToggle, onDuplicate, isRTL }: SortableLinkItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasSmartFeatures = link.smartConditions && (
    link.smartConditions.deviceTargeting?.enabled ||
    link.smartConditions.scheduling?.enabled ||
    link.smartConditions.clickLimit?.enabled
  );

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={itemVariants}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        isDragging ? "shadow-2xl ring-2 ring-primary z-50" : "hover:shadow-lg",
        !link.enabled && "opacity-60"
      )}
    >
      {/* Gradient Accent */}
      <div className="absolute top-0 start-0 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center gap-4 p-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-xl transition-colors"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Link Icon/Thumbnail */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
          {link.icon ? (
            <span className="text-2xl">{link.icon}</span>
          ) : (
            <LinkIcon className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Link Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate">{link.title}</p>
            {!link.enabled && (
              <Badge variant="secondary" className="text-xs">
                {isRTL ? "معطل" : "Disabled"}
              </Badge>
            )}
            {hasSmartFeatures && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                <Zap className="w-3 h-3" />
                {isRTL ? "ذكي" : "Smart"}
              </Badge>
            )}
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground truncate flex items-center gap-1 hover:text-primary transition-colors max-w-[300px]"
          >
            <span className="truncate">{link.url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MousePointerClick className="w-3 h-3" />
              {link.clicks || 0} {isRTL ? "نقرة" : "clicks"}
            </span>
            {link.smartConditions?.scheduling?.enabled && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isRTL ? "مجدول" : "Scheduled"}
              </span>
            )}
            {link.smartConditions?.deviceTargeting?.enabled && (
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                {isRTL ? "مستهدف" : "Targeted"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={link.enabled}
            onCheckedChange={(checked) => onToggle(link, checked)}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(link)}>
                <Pencil className="w-4 h-4 me-2" />
                {isRTL ? "تعديل" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(link)}>
                <Copy className="w-4 h-4 me-2" />
                {isRTL ? "نسخ" : "Duplicate"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(link.url);
                toast.success(isRTL ? "تم نسخ الرابط!" : "Link copied!");
              }}>
                <LinkIcon className="w-4 h-4 me-2" />
                {isRTL ? "نسخ الرابط" : "Copy URL"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(link)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 me-2" />
                {isRTL ? "حذف" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

// AI Title Suggestions
const AI_TITLE_SUGGESTIONS = {
  youtube: ["Watch My Latest Video", "Subscribe to My Channel", "My YouTube"],
  instagram: ["Follow Me on Instagram", "My Instagram", "Instagram Profile"],
  twitter: ["Follow Me on X", "My Tweets", "X Profile"],
  linkedin: ["Connect on LinkedIn", "My Professional Profile", "LinkedIn"],
  github: ["Check My Code", "GitHub Profile", "My Projects"],
  tiktok: ["Watch My TikToks", "TikTok Profile", "My TikTok"],
  website: ["Visit My Website", "My Portfolio", "Official Website"],
  default: ["Check This Out", "Click Here", "Learn More"],
};

export default function LinksManager() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading } = useFirebaseAuth();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkType | null>(null);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("");
  const [smartConditions, setSmartConditions] = useState<SmartLinkConditions>({
    deviceTargeting: { enabled: false, showOnMobile: true, showOnDesktop: true, showOnTablet: true },
    scheduling: { enabled: false, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    clickLimit: { enabled: false },
    passwordProtection: { enabled: false },
    abTesting: { enabled: false, variant: "A", showPercentage: 50 },
  });
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [pendingLinkData, setPendingLinkData] = useState<{ title: string; url: string; icon: string } | null>(null);
  const [showBulkScanner, setShowBulkScanner] = useState(false);
  const isRTL = i18n.language === "ar";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!authLoading && !userProfile) {
      setLocation("/login");
    }
  }, [authLoading, userProfile, setLocation]);

  useEffect(() => {
    const fetchLinks = async () => {
      if (!userProfile) return;
      try {
        const userLinks = await getUserLinks(userProfile.uid);
        setLinks(userLinks);
      } catch (error) {
        console.error("Error fetching links:", error);
        toast.error("Failed to load links");
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchLinks();
    }
  }, [userProfile]);

  // Generate title suggestions based on URL
  useEffect(() => {
    if (!newLinkUrl) {
      setTitleSuggestions([]);
      return;
    }

    const url = newLinkUrl.toLowerCase();
    let suggestions: string[] = [];

    if (url.includes("youtube") || url.includes("youtu.be")) {
      suggestions = AI_TITLE_SUGGESTIONS.youtube;
    } else if (url.includes("instagram")) {
      suggestions = AI_TITLE_SUGGESTIONS.instagram;
    } else if (url.includes("twitter") || url.includes("x.com")) {
      suggestions = AI_TITLE_SUGGESTIONS.twitter;
    } else if (url.includes("linkedin")) {
      suggestions = AI_TITLE_SUGGESTIONS.linkedin;
    } else if (url.includes("github")) {
      suggestions = AI_TITLE_SUGGESTIONS.github;
    } else if (url.includes("tiktok")) {
      suggestions = AI_TITLE_SUGGESTIONS.tiktok;
    } else {
      suggestions = AI_TITLE_SUGGESTIONS.default;
    }

    setTitleSuggestions(suggestions);
  }, [newLinkUrl]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);

      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      try {
        await reorderLinks(newLinks);
      } catch (error) {
        console.error("Error reordering links:", error);
        toast.error("Failed to reorder links");
      }
    }
  };

  const initiateAddLink = async () => {
    if (!newLinkTitle || !newLinkUrl || !userProfile) return;

    // Validate URL
    try {
      new URL(newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`);
    } catch {
      toast.error(t("links.invalidUrl"));
      return;
    }

    const finalUrl = newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`;
    
    // Store pending link data and show scan dialog
    setPendingLinkData({ title: newLinkTitle, url: finalUrl, icon: newLinkIcon });
    setShowAddDialog(false);
    setShowScanDialog(true);
  };

  const handleAddLink = async () => {
    if (!pendingLinkData || !userProfile) return;

    setSaving(true);
    try {
      const linkId = await createLink(userProfile.uid, pendingLinkData.title, pendingLinkData.url);
      const newLink: LinkType = {
        id: linkId,
        uid: userProfile.uid,
        title: pendingLinkData.title,
        url: pendingLinkData.url,
        icon: pendingLinkData.icon,
        enabled: true,
        order: links.length,
        clicks: 0,
        smartConditions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setLinks([...links, newLink]);
      resetForm();
      setShowAddDialog(false);
      toast.success(t("links.linkAdded"));
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLink = async () => {
    if (!selectedLink || !newLinkTitle || !newLinkUrl) return;

    // Validate URL
    try {
      new URL(newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`);
    } catch {
      toast.error(t("links.invalidUrl"));
      return;
    }

    setSaving(true);
    try {
      const finalUrl = newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`;
      await updateLink(selectedLink.id, {
        title: newLinkTitle,
        url: finalUrl,
        icon: newLinkIcon,
        smartConditions,
      });
      setLinks(
        links.map((link) =>
          link.id === selectedLink.id
            ? { ...link, title: newLinkTitle, url: finalUrl, icon: newLinkIcon, smartConditions }
            : link
        )
      );
      setShowEditDialog(false);
      setSelectedLink(null);
      resetForm();
      toast.success(t("links.linkUpdated"));
    } catch (error) {
      console.error("Error updating link:", error);
      toast.error("Failed to update link");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedLink) return;

    setSaving(true);
    try {
      await deleteLink(selectedLink.id);
      setLinks(links.filter((link) => link.id !== selectedLink.id));
      setShowDeleteDialog(false);
      setSelectedLink(null);
      toast.success(t("links.linkDeleted"));
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLink = async (link: LinkType, enabled: boolean) => {
    try {
      await updateLink(link.id, { enabled });
      setLinks(
        links.map((l) => (l.id === link.id ? { ...l, enabled } : l))
      );
    } catch (error) {
      console.error("Error toggling link:", error);
      toast.error("Failed to update link");
    }
  };

  const handleDuplicateLink = async (link: LinkType) => {
    if (!userProfile) return;

    setSaving(true);
    try {
      const linkId = await createLink(userProfile.uid, `${link.title} (Copy)`, link.url);
      const newLink: LinkType = {
        ...link,
        id: linkId,
        title: `${link.title} (Copy)`,
        order: links.length,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setLinks([...links, newLink]);
      toast.success(isRTL ? "تم نسخ الرابط!" : "Link duplicated!");
    } catch (error) {
      console.error("Error duplicating link:", error);
      toast.error("Failed to duplicate link");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (link: LinkType) => {
    setSelectedLink(link);
    setNewLinkTitle(link.title);
    setNewLinkUrl(link.url);
    setNewLinkIcon(link.icon || "");
    setSmartConditions(link.smartConditions || {
      deviceTargeting: { enabled: false, showOnMobile: true, showOnDesktop: true, showOnTablet: true },
      scheduling: { enabled: false, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      clickLimit: { enabled: false },
      passwordProtection: { enabled: false },
      abTesting: { enabled: false, variant: "A", showPercentage: 50 },
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (link: LinkType) => {
    setSelectedLink(link);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setNewLinkTitle("");
    setNewLinkUrl("");
    setNewLinkIcon("");
    setSmartConditions({
      deviceTargeting: { enabled: false, showOnMobile: true, showOnDesktop: true, showOnTablet: true },
      scheduling: { enabled: false, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      clickLimit: { enabled: false },
      passwordProtection: { enabled: false },
      abTesting: { enabled: false, variant: "A", showPercentage: 50 },
    });
    setTitleSuggestions([]);
  };

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const activeLinks = links.filter(l => l.enabled).length;

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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            {t("links.manageLinks")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("links.dragToReorder")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkScanner(true)}
            disabled={links.length === 0}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            {isRTL ? "فحص الروابط" : "Scan Links"}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-4 h-4 me-2" />
            {t("links.addLink")}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "إجمالي الروابط" : "Total Links"}</p>
              <p className="text-2xl font-bold">{links.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "روابط نشطة" : "Active Links"}</p>
              <p className="text-2xl font-bold">{activeLinks}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "إجمالي النقرات" : "Total Clicks"}</p>
              <p className="text-2xl font-bold">{totalClicks}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Links List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                <LinkIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("links.noLinks")}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isRTL 
                  ? "أضف روابطك لمواقع التواصل الاجتماعي، موقعك الشخصي، أو أي رابط تريد مشاركته مع جمهورك."
                  : "Add your social media links, website, or any link you want to share with your audience."}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4 me-2" />
                {t("links.addFirstLink")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <motion.div className="space-y-3" variants={containerVariants}>
              <AnimatePresence>
                {links.map((link) => (
                  <SortableLinkItem
                    key={link.id}
                    link={link}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    onToggle={handleToggleLink}
                    onDuplicate={handleDuplicateLink}
                    isRTL={isRTL}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Link Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              {t("links.addLink")}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? "أضف رابطاً جديداً لصفحتك الشخصية" : "Add a new link to your profile page"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label>{t("links.url")}</Label>
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="font-mono"
              />
            </div>

            {/* Title Input with AI Suggestions */}
            <div className="space-y-2">
              <Label>{t("links.title")}</Label>
              <Input
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder={isRTL ? "عنوان الرابط" : "Link title"}
              />
              
              {/* AI Title Suggestions */}
              {titleSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isRTL ? "اقتراحات ذكية" : "Smart suggestions"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {titleSuggestions.map((suggestion, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setNewLinkTitle(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Icon Input */}
            <div className="space-y-2">
              <Label>{isRTL ? "أيقونة (إيموجي)" : "Icon (Emoji)"}</Label>
              <Input
                value={newLinkIcon}
                onChange={(e) => setNewLinkIcon(e.target.value)}
                placeholder="🔗"
                className="w-24"
              />
            </div>

            {/* Smart Link Settings */}
            <SmartLinkSettings
              conditions={smartConditions}
              onChange={setSmartConditions}
              isPremium={userProfile.plan !== "free"}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={initiateAddLink}
              disabled={saving || !newLinkTitle || !newLinkUrl}
              className="bg-gradient-to-r from-blue-600 to-purple-600 gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isRTL ? "فحص وإضافة" : "Scan & Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </div>
              {t("links.editLink")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>{t("links.url")}</Label>
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("links.title")}</Label>
              <Input
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder={isRTL ? "عنوان الرابط" : "Link title"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "أيقونة (إيموجي)" : "Icon (Emoji)"}</Label>
              <Input
                value={newLinkIcon}
                onChange={(e) => setNewLinkIcon(e.target.value)}
                placeholder="🔗"
                className="w-24"
              />
            </div>

            <SmartLinkSettings
              conditions={smartConditions}
              onChange={setSmartConditions}
              isPremium={userProfile.plan !== "free"}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleEditLink}
              disabled={saving || !newLinkTitle || !newLinkUrl}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("links.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("links.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : (
                <Trash2 className="w-4 h-4 me-2" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Scanner Dialog */}
      <LinkScannerDialog
        url={pendingLinkData?.url || ""}
        open={showScanDialog}
        onOpenChange={(open) => {
          setShowScanDialog(open);
          if (!open) {
            setPendingLinkData(null);
          }
        }}
        onProceed={handleAddLink}
        onCancel={() => {
          setPendingLinkData(null);
          resetForm();
        }}
      />

      {/* Bulk Scanner Dialog */}
      <Dialog open={showBulkScanner} onOpenChange={setShowBulkScanner}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {isRTL ? "فحص جميع الروابط" : "Scan All Links"}
            </DialogTitle>
            <DialogDescription>
              {isRTL
                ? "فحص جميع روابطك للتأكد من سلامتها"
                : "Check all your links for potential security threats"}
            </DialogDescription>
          </DialogHeader>
          <BulkLinkScanner
            links={links.map((l) => ({ id: l.id, url: l.url, title: l.title }))}
            onComplete={(results) => {
              const unsafeCount = Array.from(results.values()).filter((r) => !r.isSafe).length;
              if (unsafeCount > 0) {
                toast.warning(
                  isRTL
                    ? `تم اكتشاف ${unsafeCount} رابط مشبوه`
                    : `Found ${unsafeCount} potentially unsafe link(s)`
                );
              } else {
                toast.success(
                  isRTL ? "جميع الروابط آمنة!" : "All links are safe!"
                );
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
