import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Palette,
  Type,
  Image,
  Sparkles,
  RotateCcw,
  Save,
  Eye,
  Smartphone,
  Monitor,
  Link2,
  User,
  ChevronDown,
  Check,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Custom Theme Interface
export interface CustomTheme {
  id: string;
  name: string;
  // Background
  backgroundColor: string;
  backgroundGradient: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
  backgroundImage?: string;
  backgroundBlur: number;
  backgroundOverlay: number;
  // Card/Button Styles
  cardBackgroundColor: string;
  cardOpacity: number;
  cardBlur: number;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardBorderRadius: number;
  cardShadow: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  // Text
  textColor: string;
  textSecondaryColor: string;
  fontFamily: string;
  // Effects
  enableAnimation: boolean;
  animationType: "none" | "pulse" | "gradient" | "glow";
  enableGlassmorphism: boolean;
}

// Default custom theme
const DEFAULT_CUSTOM_THEME: CustomTheme = {
  id: "custom",
  name: "Custom Theme",
  backgroundColor: "#1a1a2e",
  backgroundGradient: true,
  gradientFrom: "#1a1a2e",
  gradientTo: "#16213e",
  gradientDirection: "to-br",
  backgroundBlur: 0,
  backgroundOverlay: 0,
  cardBackgroundColor: "#ffffff",
  cardOpacity: 15,
  cardBlur: 12,
  cardBorderColor: "#ffffff",
  cardBorderWidth: 1,
  cardBorderRadius: 16,
  cardShadow: "lg",
  textColor: "#ffffff",
  textSecondaryColor: "#a0aec0",
  fontFamily: "Inter",
  enableAnimation: false,
  animationType: "none",
  enableGlassmorphism: true,
};

// Font options
const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Cairo", label: "Cairo (Arabic)" },
  { value: "Tajawal", label: "Tajawal (Arabic)" },
];

// Gradient direction options
const GRADIENT_DIRECTIONS = [
  { value: "to-r", label: "→ Right" },
  { value: "to-l", label: "← Left" },
  { value: "to-t", label: "↑ Top" },
  { value: "to-b", label: "↓ Bottom" },
  { value: "to-br", label: "↘ Bottom Right" },
  { value: "to-bl", label: "↙ Bottom Left" },
  { value: "to-tr", label: "↗ Top Right" },
  { value: "to-tl", label: "↖ Top Left" },
];

// Color presets
const COLOR_PRESETS = [
  { name: "Ocean", colors: ["#0f3460", "#16213e", "#1a1a2e"] },
  { name: "Sunset", colors: ["#ff6b6b", "#ee5a24", "#f39c12"] },
  { name: "Forest", colors: ["#27ae60", "#2ecc71", "#1abc9c"] },
  { name: "Purple", colors: ["#9b59b6", "#8e44ad", "#6c3483"] },
  { name: "Dark", colors: ["#2c3e50", "#34495e", "#1a252f"] },
  { name: "Candy", colors: ["#ff9ff3", "#feca57", "#48dbfb"] },
];

interface ThemeEditorProps {
  initialTheme?: CustomTheme;
  onSave: (theme: CustomTheme) => void;
  onPreview?: (theme: CustomTheme) => void;
  userProfile?: {
    displayName: string;
    username: string;
    bio: string;
    photoURL?: string;
  };
  links?: Array<{ id: string; title: string; url: string; icon?: string }>;
}

export default function ThemeEditor({
  initialTheme,
  onSave,
  onPreview,
  userProfile = {
    displayName: "John Doe",
    username: "johndoe",
    bio: "Digital creator & developer",
  },
  links = [
    { id: "1", title: "My Website", url: "https://example.com", icon: "🌐" },
    { id: "2", title: "Twitter", url: "https://twitter.com", icon: "🐦" },
    { id: "3", title: "Instagram", url: "https://instagram.com", icon: "📸" },
  ],
}: ThemeEditorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  const [theme, setTheme] = useState<CustomTheme>(initialTheme || DEFAULT_CUSTOM_THEME);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("mobile");
  const [activeTab, setActiveTab] = useState("background");
  const [hasChanges, setHasChanges] = useState(false);

  // Update theme property
  const updateTheme = useCallback((key: keyof CustomTheme, value: any) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Apply color preset
  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateTheme("gradientFrom", preset.colors[0]);
    updateTheme("gradientTo", preset.colors[1]);
    updateTheme("backgroundColor", preset.colors[2]);
    toast.success(isRTL ? `تم تطبيق ${preset.name}` : `Applied ${preset.name} preset`);
  };

  // Reset to default
  const resetTheme = () => {
    setTheme(DEFAULT_CUSTOM_THEME);
    setHasChanges(true);
    toast.info(isRTL ? "تم إعادة التعيين" : "Reset to default");
  };

  // Save theme
  const handleSave = () => {
    onSave(theme);
    setHasChanges(false);
    toast.success(isRTL ? "تم حفظ الثيم بنجاح!" : "Theme saved successfully!");
  };

  // Generate CSS from theme
  const generatePreviewStyles = () => {
    const bgStyle = theme.backgroundGradient
      ? `linear-gradient(${theme.gradientDirection.replace("to-", "to ")}, ${theme.gradientFrom}, ${theme.gradientTo})`
      : theme.backgroundColor;

    const cardBg = theme.enableGlassmorphism
      ? `rgba(${hexToRgb(theme.cardBackgroundColor)}, ${theme.cardOpacity / 100})`
      : theme.cardBackgroundColor;

    const cardBlur = theme.enableGlassmorphism ? `blur(${theme.cardBlur}px)` : "none";

    const shadowMap = {
      none: "none",
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    };

    return {
      container: {
        background: bgStyle,
        fontFamily: theme.fontFamily,
      },
      card: {
        backgroundColor: cardBg,
        backdropFilter: cardBlur,
        WebkitBackdropFilter: cardBlur,
        border: `${theme.cardBorderWidth}px solid rgba(${hexToRgb(theme.cardBorderColor)}, 0.3)`,
        borderRadius: `${theme.cardBorderRadius}px`,
        boxShadow: shadowMap[theme.cardShadow],
      },
      text: {
        color: theme.textColor,
      },
      textSecondary: {
        color: theme.textSecondaryColor,
      },
    };
  };

  // Helper: Convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "255, 255, 255";
  };

  const styles = generatePreviewStyles();

  return (
    <div className={cn("flex flex-col lg:flex-row gap-6 h-full", isRTL && "rtl")}>
      {/* Editor Panel */}
      <div className="flex-1 lg:max-w-md">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                {isRTL ? "محرر الثيم" : "Theme Editor"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={resetTheme}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isRTL ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="background" className="gap-1">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">{isRTL ? "الخلفية" : "BG"}</span>
                </TabsTrigger>
                <TabsTrigger value="cards" className="gap-1">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">{isRTL ? "البطاقات" : "Cards"}</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-1">
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">{isRTL ? "النص" : "Text"}</span>
                </TabsTrigger>
                <TabsTrigger value="effects" className="gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">{isRTL ? "تأثيرات" : "FX"}</span>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] pr-4">
                {/* Background Tab */}
                <TabsContent value="background" className="space-y-4 mt-0">
                  {/* Color Presets */}
                  <div className="space-y-2">
                    <Label>{isRTL ? "ألوان جاهزة" : "Color Presets"}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyColorPreset(preset)}
                          className="group relative h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                          style={{
                            background: `linear-gradient(to right, ${preset.colors.join(", ")})`,
                          }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gradient Toggle */}
                  <div className="flex items-center justify-between">
                    <Label>{isRTL ? "تدرج لوني" : "Gradient"}</Label>
                    <Switch
                      checked={theme.backgroundGradient}
                      onCheckedChange={(v) => updateTheme("backgroundGradient", v)}
                    />
                  </div>

                  {theme.backgroundGradient ? (
                    <>
                      {/* Gradient Colors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{isRTL ? "اللون الأول" : "From"}</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.gradientFrom}
                              onChange={(e) => updateTheme("gradientFrom", e.target.value)}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={theme.gradientFrom}
                              onChange={(e) => updateTheme("gradientFrom", e.target.value)}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{isRTL ? "اللون الثاني" : "To"}</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.gradientTo}
                              onChange={(e) => updateTheme("gradientTo", e.target.value)}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={theme.gradientTo}
                              onChange={(e) => updateTheme("gradientTo", e.target.value)}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Gradient Direction */}
                      <div className="space-y-2">
                        <Label>{isRTL ? "اتجاه التدرج" : "Direction"}</Label>
                        <Select
                          value={theme.gradientDirection}
                          onValueChange={(v) => updateTheme("gradientDirection", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADIENT_DIRECTIONS.map((dir) => (
                              <SelectItem key={dir.value} value={dir.value}>
                                {dir.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    /* Solid Color */
                    <div className="space-y-2">
                      <Label>{isRTL ? "لون الخلفية" : "Background Color"}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={theme.backgroundColor}
                          onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={theme.backgroundColor}
                          onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Cards Tab */}
                <TabsContent value="cards" className="space-y-4 mt-0">
                  {/* Glassmorphism Toggle */}
                  <div className="flex items-center justify-between">
                    <Label>{isRTL ? "تأثير الزجاج" : "Glassmorphism"}</Label>
                    <Switch
                      checked={theme.enableGlassmorphism}
                      onCheckedChange={(v) => updateTheme("enableGlassmorphism", v)}
                    />
                  </div>

                  {/* Card Background Color */}
                  <div className="space-y-2">
                    <Label>{isRTL ? "لون البطاقة" : "Card Color"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.cardBackgroundColor}
                        onChange={(e) => updateTheme("cardBackgroundColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={theme.cardBackgroundColor}
                        onChange={(e) => updateTheme("cardBackgroundColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {theme.enableGlassmorphism && (
                    <>
                      {/* Card Opacity */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>{isRTL ? "الشفافية" : "Opacity"}</Label>
                          <span className="text-sm text-muted-foreground">{theme.cardOpacity}%</span>
                        </div>
                        <Slider
                          value={[theme.cardOpacity]}
                          onValueChange={([v]) => updateTheme("cardOpacity", v)}
                          min={5}
                          max={100}
                          step={5}
                        />
                      </div>

                      {/* Card Blur */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>{isRTL ? "الضبابية" : "Blur"}</Label>
                          <span className="text-sm text-muted-foreground">{theme.cardBlur}px</span>
                        </div>
                        <Slider
                          value={[theme.cardBlur]}
                          onValueChange={([v]) => updateTheme("cardBlur", v)}
                          min={0}
                          max={24}
                          step={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Border Radius */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{isRTL ? "استدارة الحواف" : "Border Radius"}</Label>
                      <span className="text-sm text-muted-foreground">{theme.cardBorderRadius}px</span>
                    </div>
                    <Slider
                      value={[theme.cardBorderRadius]}
                      onValueChange={([v]) => updateTheme("cardBorderRadius", v)}
                      min={0}
                      max={32}
                      step={2}
                    />
                  </div>

                  {/* Border Width */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{isRTL ? "سمك الإطار" : "Border Width"}</Label>
                      <span className="text-sm text-muted-foreground">{theme.cardBorderWidth}px</span>
                    </div>
                    <Slider
                      value={[theme.cardBorderWidth]}
                      onValueChange={([v]) => updateTheme("cardBorderWidth", v)}
                      min={0}
                      max={4}
                      step={1}
                    />
                  </div>

                  {/* Shadow */}
                  <div className="space-y-2">
                    <Label>{isRTL ? "الظل" : "Shadow"}</Label>
                    <Select
                      value={theme.cardShadow}
                      onValueChange={(v) => updateTheme("cardShadow", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isRTL ? "بدون" : "None"}</SelectItem>
                        <SelectItem value="sm">{isRTL ? "صغير" : "Small"}</SelectItem>
                        <SelectItem value="md">{isRTL ? "متوسط" : "Medium"}</SelectItem>
                        <SelectItem value="lg">{isRTL ? "كبير" : "Large"}</SelectItem>
                        <SelectItem value="xl">{isRTL ? "كبير جداً" : "Extra Large"}</SelectItem>
                        <SelectItem value="2xl">{isRTL ? "ضخم" : "2XL"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Text Tab */}
                <TabsContent value="text" className="space-y-4 mt-0">
                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label>{isRTL ? "نوع الخط" : "Font Family"}</Label>
                    <Select
                      value={theme.fontFamily}
                      onValueChange={(v) => updateTheme("fontFamily", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Primary Text Color */}
                  <div className="space-y-2">
                    <Label>{isRTL ? "لون النص الرئيسي" : "Primary Text"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.textColor}
                        onChange={(e) => updateTheme("textColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={theme.textColor}
                        onChange={(e) => updateTheme("textColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Secondary Text Color */}
                  <div className="space-y-2">
                    <Label>{isRTL ? "لون النص الثانوي" : "Secondary Text"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.textSecondaryColor}
                        onChange={(e) => updateTheme("textSecondaryColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={theme.textSecondaryColor}
                        onChange={(e) => updateTheme("textSecondaryColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="space-y-4 mt-0">
                  {/* Animation Toggle */}
                  <div className="flex items-center justify-between">
                    <Label>{isRTL ? "تفعيل الحركة" : "Enable Animation"}</Label>
                    <Switch
                      checked={theme.enableAnimation}
                      onCheckedChange={(v) => updateTheme("enableAnimation", v)}
                    />
                  </div>

                  {theme.enableAnimation && (
                    <div className="space-y-2">
                      <Label>{isRTL ? "نوع الحركة" : "Animation Type"}</Label>
                      <Select
                        value={theme.animationType}
                        onValueChange={(v) => updateTheme("animationType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{isRTL ? "بدون" : "None"}</SelectItem>
                          <SelectItem value="pulse">{isRTL ? "نبض" : "Pulse"}</SelectItem>
                          <SelectItem value="gradient">{isRTL ? "تدرج متحرك" : "Gradient"}</SelectItem>
                          <SelectItem value="glow">{isRTL ? "توهج" : "Glow"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                {isRTL ? "المعاينة" : "Preview"}
              </CardTitle>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={previewMode === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                  className="gap-1"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                  className="gap-1"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {/* Preview Container */}
            <motion.div
              layout
              className={cn(
                "relative overflow-hidden rounded-3xl border-8 border-gray-800 shadow-2xl",
                previewMode === "mobile" ? "w-[320px] h-[640px]" : "w-full max-w-[600px] h-[500px]"
              )}
            >
              {/* Preview Content */}
              <div
                className="w-full h-full overflow-y-auto"
                style={styles.container}
              >
                <div className="p-6 flex flex-col items-center">
                  {/* Avatar */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative mb-4"
                  >
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        ...styles.card,
                        backgroundColor: theme.gradientFrom,
                      }}
                    >
                      {userProfile.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span style={styles.text}>
                          {userProfile.displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Name */}
                  <h1
                    className="text-2xl font-bold mb-1"
                    style={{ ...styles.text, fontFamily: theme.fontFamily }}
                  >
                    {userProfile.displayName}
                  </h1>

                  {/* Username */}
                  <p className="text-sm mb-2" style={styles.textSecondary}>
                    @{userProfile.username}
                  </p>

                  {/* Bio */}
                  <p
                    className="text-center text-sm mb-6 max-w-[250px]"
                    style={styles.textSecondary}
                  >
                    {userProfile.bio}
                  </p>

                  {/* Links */}
                  <div className="w-full space-y-3">
                    {links.map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="w-full p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
                        style={styles.card}
                      >
                        {link.icon && <span className="text-xl">{link.icon}</span>}
                        <span
                          className="flex-1 font-medium"
                          style={{ ...styles.text, fontFamily: theme.fontFamily }}
                        >
                          {link.title}
                        </span>
                        <Link2 className="w-4 h-4" style={styles.textSecondary} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
