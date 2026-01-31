import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { updateUserProfile, uploadProfileImage } from "@/lib/firebase";
import { Camera, Loader2, User, Palette, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PROFILE_THEMES } from "@/lib/themes";
import ThemeEditor from "@/components/ThemeEditor";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, loading: authLoading, refreshProfile } = useFirebaseAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [lang, setLang] = useState<"ar" | "en">("en");
  const [themeId, setThemeId] = useState("default");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeThemeTab, setActiveThemeTab] = useState("presets");

  useEffect(() => {
    if (!authLoading && !userProfile) {
      setLocation("/login");
    }
  }, [authLoading, userProfile, setLocation]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setBio(userProfile.bio || "");
      setPhotoURL(userProfile.photoURL || "");
      setLang(userProfile.lang || "en");
      setThemeId(userProfile.themeId || "default");
      // Check if user has a custom theme
      if (userProfile.customThemeId) {
        setActiveThemeTab("custom");
      }
    }
  }, [userProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadProfileImage(userProfile.uid, file);
      setPhotoURL(url);
      await refreshProfile();
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

    setSaving(true);
    try {
      await updateUserProfile(userProfile.uid, {
        displayName,
        bio,
        lang,
        themeId,
        theme: themeId,
      });

      if (lang !== i18n.language) {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      }

      await refreshProfile();
      toast.success(t("profile.profileUpdated"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("profile.profileError"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("profile.editProfile")}</h1>
        <p className="text-muted-foreground mt-2">
          {isRTL ? "قم بتحديث معلوماتك الشخصية وصورة ملفك." : "Update your personal information and profile picture."}
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.profileImage")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={photoURL} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                  {displayName?.charAt(0) || userProfile.username?.charAt(0) || <User />}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="w-4 h-4 me-2" />
                {photoURL ? t("profile.changeImage") : t("profile.uploadImage")}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {isRTL ? "ثيم الملف الشخصي" : "Profile Theme"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "اختر المظهر الذي سيراه زوار صفحتك العامة أو أنشئ ثيم مخصص." : "Choose a preset theme or create a custom one for your public profile."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeThemeTab} onValueChange={setActiveThemeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets" className="gap-2">
                  <Palette className="w-4 h-4" />
                  {isRTL ? "الثيمات الجاهزة" : "Presets"}
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  {isRTL ? "محرر مخصص" : "Custom Editor"}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="presets" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {PROFILE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setThemeId(theme.id)}
                      className={`relative group overflow-hidden rounded-xl border-2 transition-all ${
                        themeId === theme.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`h-20 w-full ${theme.background} flex items-center justify-center`}>
                        <div className={`w-12 h-6 ${theme.card} border border-white/20 rounded shadow-sm`}></div>
                      </div>
                      <div className="p-2 text-xs font-medium bg-card text-center">
                        {theme.name}
                      </div>
                      {themeId === theme.id && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-4">
                <ThemeEditor />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("auth.username")}</Label>
              <Input value={userProfile.username} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">{t("profile.displayName")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.bioPlaceholder")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("profile.languagePreference")}</Label>
              <Select value={lang} onValueChange={(value: "ar" | "en") => setLang(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("common.english")}</SelectItem>
                  <SelectItem value="ar">{t("common.arabic")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("profile.saveChanges")
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {isRTL ? "سيتم تطبيق التغييرات على صفحتك العامة فوراً" : "Changes will be applied to your public profile immediately"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
