import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import ThemeEditor, { type CustomTheme } from "@/components/ThemeEditor";
import {
  saveCustomTheme,
  updateCustomTheme,
  getUserCustomTheme,
  getUserLinks,
  type Link as LinkType,
} from "@/lib/firebase";
import { Loader2, Palette, Crown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ThemeCustomizer() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingTheme, setExistingTheme] = useState<CustomTheme | null>(null);
  const [userLinks, setUserLinks] = useState<LinkType[]>([]);
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
        // Fetch existing custom theme
        const theme = await getUserCustomTheme(userProfile.uid);
        if (theme) {
          setExistingTheme(theme);
        }

        // Fetch user links for preview
        const links = await getUserLinks(userProfile.uid);
        setUserLinks(links);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const handleSaveTheme = async (theme: Omit<CustomTheme, "id" | "uid" | "createdAt" | "updatedAt">) => {
    if (!userProfile) return;

    setSaving(true);
    try {
      if (existingTheme) {
        // Update existing theme
        await updateCustomTheme(existingTheme.id, theme);
        toast.success(isRTL ? "تم تحديث الثيم بنجاح!" : "Theme updated successfully!");
      } else {
        // Create new theme
        const themeId = await saveCustomTheme(userProfile.uid, theme);
        setExistingTheme({ ...theme, id: themeId, uid: userProfile.uid } as CustomTheme);
        toast.success(isRTL ? "تم حفظ الثيم بنجاح!" : "Theme saved successfully!");
      }
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error(isRTL ? "فشل في حفظ الثيم" : "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  // Check if user has premium plan
  const isPremium = userProfile.plan === "pro" || userProfile.plan === "business";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "محرر الثيم المرئي" : "Visual Theme Editor"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isRTL
              ? "خصص مظهر صفحتك الشخصية بالكامل"
              : "Customize your profile page appearance"}
          </p>
        </div>
        
        {!isPremium && (
          <Badge variant="outline" className="gap-2 px-4 py-2 border-amber-500/50 text-amber-600">
            <Crown className="w-4 h-4" />
            {isRTL ? "ميزة مميزة - ترقية للاستخدام الكامل" : "Premium Feature - Upgrade for full access"}
          </Badge>
        )}
      </div>

      {/* Theme Editor */}
      <div className="min-h-[600px]">
        <ThemeEditor
          initialTheme={existingTheme as any}
          onSave={handleSaveTheme}
          userProfile={{
            displayName: userProfile.displayName,
            username: userProfile.username,
            bio: userProfile.bio,
            photoURL: userProfile.photoURL,
          }}
          links={userLinks.map((link) => ({
            id: link.id,
            title: link.title,
            url: link.url,
            icon: link.icon,
          }))}
        />
      </div>
    </motion.div>
  );
}
