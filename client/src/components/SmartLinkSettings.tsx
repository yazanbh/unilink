import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Zap,
  Crown,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SmartLinkConditions {
  // Device targeting
  deviceTargeting: {
    enabled: boolean;
    showOnMobile: boolean;
    showOnDesktop: boolean;
    showOnTablet: boolean;
  };
  // Time-based scheduling
  scheduling: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek: number[]; // 0-6, Sunday = 0
  };
  // Click limit
  clickLimit: {
    enabled: boolean;
    maxClicks?: number;
  };
  // Password protection
  passwordProtection: {
    enabled: boolean;
    password?: string;
  };
  // A/B Testing
  abTesting: {
    enabled: boolean;
    variant: "A" | "B";
    showPercentage: number; // 0-100
  };
}

interface SmartLinkSettingsProps {
  conditions: SmartLinkConditions;
  onChange: (conditions: SmartLinkConditions) => void;
  isPremium?: boolean;
  className?: string;
}

const DEFAULT_CONDITIONS: SmartLinkConditions = {
  deviceTargeting: {
    enabled: false,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTablet: true,
  },
  scheduling: {
    enabled: false,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  clickLimit: {
    enabled: false,
  },
  passwordProtection: {
    enabled: false,
  },
  abTesting: {
    enabled: false,
    variant: "A",
    showPercentage: 50,
  },
};

const DAYS_OF_WEEK = [
  { id: 0, name: "Sun", nameAr: "أحد" },
  { id: 1, name: "Mon", nameAr: "إثنين" },
  { id: 2, name: "Tue", nameAr: "ثلاثاء" },
  { id: 3, name: "Wed", nameAr: "أربعاء" },
  { id: 4, name: "Thu", nameAr: "خميس" },
  { id: 5, name: "Fri", nameAr: "جمعة" },
  { id: 6, name: "Sat", nameAr: "سبت" },
];

export function SmartLinkSettings({
  conditions = DEFAULT_CONDITIONS,
  onChange,
  isPremium = false,
  className,
}: SmartLinkSettingsProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isOpen, setIsOpen] = useState(false);

  const updateConditions = (
    section: keyof SmartLinkConditions,
    updates: Partial<SmartLinkConditions[typeof section]>
  ) => {
    onChange({
      ...conditions,
      [section]: {
        ...conditions[section],
        ...updates,
      },
    });
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = conditions.scheduling.daysOfWeek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateConditions("scheduling", { daysOfWeek: newDays });
  };

  const hasActiveConditions =
    conditions.deviceTargeting.enabled ||
    conditions.scheduling.enabled ||
    conditions.clickLimit.enabled ||
    conditions.passwordProtection.enabled ||
    conditions.abTesting.enabled;

  const FeatureSection = ({
    title,
    titleAr,
    description,
    descriptionAr,
    icon: Icon,
    enabled,
    onToggle,
    isPro = false,
    children,
  }: {
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    icon: React.ElementType;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    isPro?: boolean;
    children?: React.ReactNode;
  }) => (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              enabled
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{isRTL ? titleAr : title}</h4>
              {isPro && !isPremium && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Crown className="w-3 h-3" />
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isRTL ? descriptionAr : description}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={isPro && !isPremium}
        />
      </div>
      <AnimatePresence>
        {enabled && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between gap-2",
            hasActiveConditions && "border-primary/50 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-2">
            <Zap
              className={cn(
                "w-4 h-4",
                hasActiveConditions ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span>{isRTL ? "إعدادات الرابط الذكي" : "Smart Link Settings"}</span>
            {hasActiveConditions && (
              <Badge variant="secondary" className="text-xs">
                {isRTL ? "نشط" : "Active"}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4">
        {/* Device Targeting */}
        <FeatureSection
          title="Device Targeting"
          titleAr="استهداف الأجهزة"
          description="Show link only on specific devices"
          descriptionAr="إظهار الرابط فقط على أجهزة محددة"
          icon={Smartphone}
          enabled={conditions.deviceTargeting.enabled}
          onToggle={(enabled) =>
            updateConditions("deviceTargeting", { enabled })
          }
        >
          <div className="flex gap-3 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateConditions("deviceTargeting", {
                        showOnMobile: !conditions.deviceTargeting.showOnMobile,
                      })
                    }
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                      conditions.deviceTargeting.showOnMobile
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <Smartphone
                      className={cn(
                        "w-6 h-6",
                        conditions.deviceTargeting.showOnMobile
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm font-medium">
                      {isRTL ? "موبايل" : "Mobile"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRTL ? "الهواتف المحمولة" : "Mobile phones"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateConditions("deviceTargeting", {
                        showOnDesktop: !conditions.deviceTargeting.showOnDesktop,
                      })
                    }
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                      conditions.deviceTargeting.showOnDesktop
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <Monitor
                      className={cn(
                        "w-6 h-6",
                        conditions.deviceTargeting.showOnDesktop
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm font-medium">
                      {isRTL ? "كمبيوتر" : "Desktop"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRTL ? "أجهزة الكمبيوتر" : "Desktop computers"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateConditions("deviceTargeting", {
                        showOnTablet: !conditions.deviceTargeting.showOnTablet,
                      })
                    }
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                      conditions.deviceTargeting.showOnTablet
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <Tablet
                      className={cn(
                        "w-6 h-6",
                        conditions.deviceTargeting.showOnTablet
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm font-medium">
                      {isRTL ? "تابلت" : "Tablet"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRTL ? "الأجهزة اللوحية" : "Tablets"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </FeatureSection>

        {/* Time-based Scheduling */}
        <FeatureSection
          title="Schedule Link"
          titleAr="جدولة الرابط"
          description="Show link only during specific times"
          descriptionAr="إظهار الرابط فقط في أوقات محددة"
          icon={Calendar}
          enabled={conditions.scheduling.enabled}
          onToggle={(enabled) => updateConditions("scheduling", { enabled })}
        >
          <div className="space-y-4 pt-2">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">
                  {isRTL ? "تاريخ البداية" : "Start Date"}
                </Label>
                <Input
                  type="date"
                  value={conditions.scheduling.startDate || ""}
                  onChange={(e) =>
                    updateConditions("scheduling", { startDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">
                  {isRTL ? "تاريخ النهاية" : "End Date"}
                </Label>
                <Input
                  type="date"
                  value={conditions.scheduling.endDate || ""}
                  onChange={(e) =>
                    updateConditions("scheduling", { endDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">
                  {isRTL ? "وقت البداية" : "Start Time"}
                </Label>
                <Input
                  type="time"
                  value={conditions.scheduling.startTime || ""}
                  onChange={(e) =>
                    updateConditions("scheduling", { startTime: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">
                  {isRTL ? "وقت النهاية" : "End Time"}
                </Label>
                <Input
                  type="time"
                  value={conditions.scheduling.endTime || ""}
                  onChange={(e) =>
                    updateConditions("scheduling", { endTime: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Days of Week */}
            <div>
              <Label className="text-sm mb-2 block">
                {isRTL ? "أيام الأسبوع" : "Days of Week"}
              </Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => toggleDayOfWeek(day.id)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                      conditions.scheduling.daysOfWeek.includes(day.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {isRTL ? day.nameAr.slice(0, 1) : day.name.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FeatureSection>

        {/* Click Limit */}
        <FeatureSection
          title="Click Limit"
          titleAr="حد النقرات"
          description="Disable link after reaching click limit"
          descriptionAr="تعطيل الرابط بعد الوصول لحد النقرات"
          icon={Eye}
          enabled={conditions.clickLimit.enabled}
          onToggle={(enabled) => updateConditions("clickLimit", { enabled })}
          isPro
        >
          <div className="pt-2">
            <Label className="text-sm">
              {isRTL ? "الحد الأقصى للنقرات" : "Maximum Clicks"}
            </Label>
            <Input
              type="number"
              min="1"
              value={conditions.clickLimit.maxClicks || ""}
              onChange={(e) =>
                updateConditions("clickLimit", {
                  maxClicks: parseInt(e.target.value) || undefined,
                })
              }
              placeholder={isRTL ? "مثال: 100" : "e.g., 100"}
              className="mt-1"
            />
          </div>
        </FeatureSection>

        {/* Password Protection */}
        <FeatureSection
          title="Password Protection"
          titleAr="حماية بكلمة مرور"
          description="Require password to access link"
          descriptionAr="طلب كلمة مرور للوصول للرابط"
          icon={EyeOff}
          enabled={conditions.passwordProtection.enabled}
          onToggle={(enabled) =>
            updateConditions("passwordProtection", { enabled })
          }
          isPro
        >
          <div className="pt-2">
            <Label className="text-sm">
              {isRTL ? "كلمة المرور" : "Password"}
            </Label>
            <Input
              type="password"
              value={conditions.passwordProtection.password || ""}
              onChange={(e) =>
                updateConditions("passwordProtection", {
                  password: e.target.value,
                })
              }
              placeholder={isRTL ? "أدخل كلمة المرور" : "Enter password"}
              className="mt-1"
            />
          </div>
        </FeatureSection>

        {/* A/B Testing */}
        <FeatureSection
          title="A/B Testing"
          titleAr="اختبار A/B"
          description="Show link to a percentage of visitors"
          descriptionAr="إظهار الرابط لنسبة من الزوار"
          icon={Sparkles}
          enabled={conditions.abTesting.enabled}
          onToggle={(enabled) => updateConditions("abTesting", { enabled })}
          isPro
        >
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm">
                {isRTL ? "المتغير" : "Variant"}
              </Label>
              <Select
                value={conditions.abTesting.variant}
                onValueChange={(value: "A" | "B") =>
                  updateConditions("abTesting", { variant: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Variant A</SelectItem>
                  <SelectItem value="B">Variant B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">
                {isRTL ? "نسبة الظهور" : "Show Percentage"}: {conditions.abTesting.showPercentage}%
              </Label>
              <input
                type="range"
                min="0"
                max="100"
                value={conditions.abTesting.showPercentage}
                onChange={(e) =>
                  updateConditions("abTesting", {
                    showPercentage: parseInt(e.target.value),
                  })
                }
                className="w-full mt-2"
              />
            </div>
          </div>
        </FeatureSection>

        {/* Pro Upgrade Banner */}
        {!isPremium && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">
                  {isRTL ? "احصل على المزيد من المزايا" : "Unlock More Features"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "قم بالترقية للحصول على جميع مزايا الروابط الذكية"
                    : "Upgrade to access all smart link features"}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {isRTL ? "ترقية" : "Upgrade"}
              </Button>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default SmartLinkSettings;
