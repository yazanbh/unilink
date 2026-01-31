import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Sparkles, Palette, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROFILE_THEMES,
  THEME_CATEGORIES,
  type ProfileTheme,
} from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThemeSelectorAdvancedProps {
  currentThemeId: string;
  onSelectTheme: (theme: ProfileTheme) => void;
  userPlan?: "free" | "pro" | "business";
  className?: string;
}

export function ThemeSelectorAdvanced({
  currentThemeId,
  onSelectTheme,
  userPlan = "free",
  className,
}: ThemeSelectorAdvancedProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTheme, setPreviewTheme] = useState<ProfileTheme | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const canUsePremium = userPlan === "pro" || userPlan === "business";

  const filteredThemes =
    selectedCategory === "all"
      ? PROFILE_THEMES
      : PROFILE_THEMES.filter((theme) => theme.category === selectedCategory);

  const handleSelectTheme = (theme: ProfileTheme) => {
    if (theme.isPremium && !canUsePremium) {
      // Show upgrade prompt
      return;
    }
    onSelectTheme(theme);
    setIsOpen(false);
  };

  const currentTheme = PROFILE_THEMES.find((t) => t.id === currentThemeId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 h-auto py-3 px-4 justify-start",
            className
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              currentTheme?.background || "bg-gradient-to-br from-blue-500 to-purple-500"
            )}
          >
            <Palette className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {isRTL ? currentTheme?.nameAr : currentTheme?.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {isRTL ? "اضغط لتغيير الثيم" : "Click to change theme"}
            </span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            {isRTL ? "اختر ثيم صفحتك" : "Choose Your Theme"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full">
          {/* Preview Section */}
          <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-e bg-muted/30">
            <div className="sticky top-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                {isRTL ? "معاينة" : "Preview"}
              </h3>
              <div
                className={cn(
                  "aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500",
                  (previewTheme || currentTheme)?.background
                )}
              >
                <div className="h-full flex flex-col items-center justify-center p-4">
                  {/* Mini Profile Preview */}
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm mb-3" />
                  <div className="w-24 h-3 rounded-full bg-white/40 mb-2" />
                  <div className="w-16 h-2 rounded-full bg-white/30 mb-6" />
                  
                  {/* Mini Links Preview */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-full max-w-[140px] h-8 mb-2 transition-all duration-300",
                        (previewTheme || currentTheme)?.card,
                        (previewTheme || currentTheme)?.buttonRadius
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Theme Info */}
              <div className="mt-4 p-3 rounded-xl bg-background/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {isRTL
                      ? (previewTheme || currentTheme)?.nameAr
                      : (previewTheme || currentTheme)?.name}
                  </span>
                  {(previewTheme || currentTheme)?.isPremium && (
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="w-3 h-3" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Themes Grid Section */}
          <div className="flex-1 flex flex-col">
            {/* Category Tabs */}
            <Tabs
              defaultValue="all"
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <div className="px-6 pt-4">
                <ScrollArea className="w-full" dir={isRTL ? "rtl" : "ltr"}>
                  <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl gap-1">
                    <TabsTrigger
                      value="all"
                      className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      {isRTL ? "الكل" : "All"}
                    </TabsTrigger>
                    {THEME_CATEGORIES.map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                      >
                        <span className="me-1">{category.icon}</span>
                        {isRTL ? category.nameAr : category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </ScrollArea>
              </div>

              <TabsContent value={selectedCategory} className="flex-1 mt-0">
                <ScrollArea className="h-[400px] px-6 py-4">
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredThemes.map((theme, index) => (
                        <motion.button
                          key={theme.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSelectTheme(theme)}
                          onMouseEnter={() => setPreviewTheme(theme)}
                          onMouseLeave={() => setPreviewTheme(null)}
                          className={cn(
                            "relative group aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-300",
                            currentThemeId === theme.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-primary/50",
                            theme.isPremium && !canUsePremium && "opacity-70"
                          )}
                        >
                          {/* Theme Preview */}
                          <div
                            className={cn(
                              "absolute inset-0 transition-transform duration-300 group-hover:scale-105",
                              theme.background,
                              theme.animation
                            )}
                          >
                            {/* Mini preview content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                              <div className="w-6 h-6 rounded-full bg-white/30 mb-1" />
                              <div className="w-12 h-1.5 rounded-full bg-white/40 mb-2" />
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-full max-w-[60px] h-4 mb-1",
                                    theme.card,
                                    theme.buttonRadius
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {currentThemeId === theme.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 end-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </motion.div>
                          )}

                          {/* Premium Lock */}
                          {theme.isPremium && !canUsePremium && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                              <div className="bg-black/60 rounded-full p-2">
                                <Lock className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Premium Badge */}
                          {theme.isPremium && (
                            <div className="absolute top-2 start-2">
                              <Badge
                                variant="secondary"
                                className="bg-yellow-500/90 text-yellow-950 text-[10px] px-1.5 py-0"
                              >
                                <Crown className="w-2.5 h-2.5 me-0.5" />
                                PRO
                              </Badge>
                            </div>
                          )}

                          {/* Theme Name Overlay */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                            <p className="text-white text-xs font-medium truncate">
                              {isRTL ? theme.nameAr : theme.name}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Upgrade Banner for Free Users */}
            {!canUsePremium && (
              <div className="p-4 mx-6 mb-6 rounded-xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {isRTL
                        ? "احصل على ثيمات مميزة"
                        : "Unlock Premium Themes"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL
                        ? "قم بالترقية للحصول على جميع الثيمات الحصرية"
                        : "Upgrade to access all exclusive themes"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    {isRTL ? "ترقية" : "Upgrade"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ThemeSelectorAdvanced;
