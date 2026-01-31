import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  ChevronRight,
  Briefcase,
  Heart,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIBioGeneratorProps {
  currentBio?: string;
  onBioGenerated: (bio: string) => void;
  className?: string;
}

type BioStyle = "professional" | "casual" | "creative" | "minimal" | "fun";
type BioLength = "short" | "medium" | "long";

const BIO_STYLES: { id: BioStyle; name: string; nameAr: string; icon: React.ReactNode; description: string; descriptionAr: string }[] = [
  {
    id: "professional",
    name: "Professional",
    nameAr: "احترافي",
    icon: <Briefcase className="w-4 h-4" />,
    description: "Formal and business-oriented",
    descriptionAr: "رسمي وموجه للأعمال",
  },
  {
    id: "casual",
    name: "Casual",
    nameAr: "عادي",
    icon: <Heart className="w-4 h-4" />,
    description: "Friendly and approachable",
    descriptionAr: "ودود وسهل التواصل",
  },
  {
    id: "creative",
    name: "Creative",
    nameAr: "إبداعي",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Unique and artistic",
    descriptionAr: "فريد وفني",
  },
  {
    id: "minimal",
    name: "Minimal",
    nameAr: "بسيط",
    icon: <Target className="w-4 h-4" />,
    description: "Short and to the point",
    descriptionAr: "قصير ومباشر",
  },
  {
    id: "fun",
    name: "Fun",
    nameAr: "مرح",
    icon: <Zap className="w-4 h-4" />,
    description: "Playful with emojis",
    descriptionAr: "مرح مع إيموجي",
  },
];

const SUGGESTED_KEYWORDS = {
  en: [
    "Developer", "Designer", "Creator", "Entrepreneur", "Artist",
    "Writer", "Photographer", "Musician", "Coach", "Consultant",
    "Influencer", "Blogger", "Freelancer", "Student", "Teacher",
  ],
  ar: [
    "مطور", "مصمم", "صانع محتوى", "رائد أعمال", "فنان",
    "كاتب", "مصور", "موسيقي", "مدرب", "استشاري",
    "مؤثر", "مدون", "مستقل", "طالب", "معلم",
  ],
};

export function AIBioGenerator({
  currentBio,
  onBioGenerated,
  className,
}: AIBioGeneratorProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [profession, setProfession] = useState("");
  const [interests, setInterests] = useState("");
  const [style, setStyle] = useState<BioStyle>("professional");
  const [length, setLength] = useState<BioLength>("medium");
  const [language, setLanguage] = useState<"en" | "ar">(isRTL ? "ar" : "en");
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  
  // Generated bios
  const [generatedBios, setGeneratedBios] = useState<string[]>([]);
  const [selectedBio, setSelectedBio] = useState<string | null>(null);

  const generateBios = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (in production, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const bios = generateMockBios();
    setGeneratedBios(bios);
    setStep(3);
    setIsGenerating(false);
  };

  const generateMockBios = (): string[] => {
    const templates = {
      professional: {
        en: [
          `${profession} passionate about ${interests}. Helping others achieve their goals through expertise and dedication.`,
          `Experienced ${profession} specializing in ${interests}. Let's connect and create something amazing together.`,
          `${profession} | ${interests} enthusiast | Turning ideas into reality. Open for collaborations.`,
        ],
        ar: [
          `${profession} شغوف بـ ${interests}. أساعد الآخرين في تحقيق أهدافهم من خلال الخبرة والتفاني.`,
          `${profession} متخصص في ${interests}. دعنا نتواصل ونصنع شيئاً مذهلاً معاً.`,
          `${profession} | متحمس لـ ${interests} | أحول الأفكار إلى واقع. منفتح للتعاون.`,
        ],
      },
      casual: {
        en: [
          `Hey! I'm a ${profession} who loves ${interests}. Always up for a good chat! ☕`,
          `Just a ${profession} doing what I love - ${interests}. Say hi! 👋`,
          `${profession} by day, ${interests} enthusiast by night. Let's be friends!`,
        ],
        ar: [
          `مرحباً! أنا ${profession} أحب ${interests}. دائماً جاهز لدردشة جميلة! ☕`,
          `مجرد ${profession} يفعل ما يحب - ${interests}. قل مرحباً! 👋`,
          `${profession} بالنهار، متحمس لـ ${interests} بالليل. لنكن أصدقاء!`,
        ],
      },
      creative: {
        en: [
          `✨ ${profession} crafting digital magic through ${interests}. Every pixel tells a story.`,
          `🎨 Where ${profession} meets ${interests}. Creating experiences that inspire.`,
          `🚀 ${profession} on a mission to revolutionize ${interests}. Join the journey.`,
        ],
        ar: [
          `✨ ${profession} أصنع السحر الرقمي من خلال ${interests}. كل بكسل يحكي قصة.`,
          `🎨 حيث يلتقي ${profession} مع ${interests}. أصنع تجارب ملهمة.`,
          `🚀 ${profession} في مهمة لإحداث ثورة في ${interests}. انضم للرحلة.`,
        ],
      },
      minimal: {
        en: [
          `${profession}. ${interests}.`,
          `${profession} | ${interests}`,
          `Making ${interests} happen.`,
        ],
        ar: [
          `${profession}. ${interests}.`,
          `${profession} | ${interests}`,
          `أجعل ${interests} يحدث.`,
        ],
      },
      fun: {
        en: [
          `🔥 ${profession} who can't stop talking about ${interests}! 🎉 DM me!`,
          `😎 ${profession} + ${interests} = This profile! Let's vibe! ✌️`,
          `🌟 Living my best ${profession} life! Obsessed with ${interests}! 💫`,
        ],
        ar: [
          `🔥 ${profession} لا يستطيع التوقف عن الحديث عن ${interests}! 🎉 راسلني!`,
          `😎 ${profession} + ${interests} = هذا الملف! لنستمتع! ✌️`,
          `🌟 أعيش أفضل حياة ${profession}! مهووس بـ ${interests}! 💫`,
        ],
      },
    };

    let bios = templates[style][language];
    
    // Add CTA if enabled
    if (includeCTA) {
      const ctas = {
        en: [" 👇 Check my links!", " ⬇️ Explore below!", " 🔗 Links below!"],
        ar: [" 👇 تفقد روابطي!", " ⬇️ استكشف أدناه!", " 🔗 الروابط أدناه!"],
      };
      bios = bios.map((bio, i) => bio + ctas[language][i % ctas[language].length]);
    }

    // Remove emojis if disabled
    if (!includeEmoji) {
      // Remove common emojis
      bios = bios.map(bio => {
        return bio.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '').replace(/[\u2600-\u27BF]/g, '').trim();
      });
    }

    // Adjust length
    if (length === "short") {
      bios = bios.map(bio => bio.split('.')[0] + '.');
    } else if (length === "long") {
      const additions = {
        en: " I believe in continuous learning and growth. Always exploring new horizons.",
        ar: " أؤمن بالتعلم المستمر والنمو. دائماً أستكشف آفاقاً جديدة.",
      };
      bios = bios.map(bio => bio + additions[language]);
    }

    return bios;
  };

  const handleCopy = (bio: string) => {
    navigator.clipboard.writeText(bio);
    setCopied(true);
    toast.success(isRTL ? "تم نسخ السيرة الذاتية!" : "Bio copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseBio = (bio: string) => {
    onBioGenerated(bio);
    setIsOpen(false);
    toast.success(isRTL ? "تم تطبيق السيرة الذاتية!" : "Bio applied!");
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setProfession("");
    setInterests("");
    setStyle("professional");
    setLength("medium");
    setGeneratedBios([]);
    setSelectedBio(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50",
            className
          )}
        >
          <Wand2 className="w-4 h-4 text-violet-500" />
          {isRTL ? "توليد بالذكاء الاصطناعي" : "Generate with AI"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {isRTL ? "مولد السيرة الذاتية بالذكاء الاصطناعي" : "AI Bio Generator"}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? "دع الذكاء الاصطناعي يساعدك في كتابة سيرة ذاتية جذابة ومميزة"
              : "Let AI help you write an engaging and unique bio"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step >= s
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                    : "bg-muted text-muted-foreground"
                )}
                animate={{ scale: step === s ? 1.1 : 1 }}
              >
                {s}
              </motion.div>
              {s < 3 && (
                <div className={cn(
                  "w-12 h-1 mx-1 rounded-full transition-all",
                  step > s ? "bg-gradient-to-r from-violet-500 to-purple-600" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {isRTL ? "ما هي مهنتك أو تخصصك؟" : "What's your profession or specialty?"}
                  </Label>
                  <Input
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder={isRTL ? "مثال: مصمم جرافيك" : "e.g., Graphic Designer"}
                    className="mt-2"
                  />
                  {/* Suggested Keywords */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {SUGGESTED_KEYWORDS[language].slice(0, 8).map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setProfession(keyword)}
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {isRTL ? "ما هي اهتماماتك أو شغفك؟" : "What are your interests or passions?"}
                  </Label>
                  <Input
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder={isRTL ? "مثال: التصميم، التكنولوجيا، الفن" : "e.g., Design, Technology, Art"}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {isRTL ? "لغة السيرة الذاتية" : "Bio Language"}
                  </Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ar")}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={() => setStep(2)}
                disabled={!profession.trim()}
              >
                {isRTL ? "التالي" : "Next"}
                <ChevronRight className="w-4 h-4 ms-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Style Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div>
                <Label className="text-base font-medium mb-3 block">
                  {isRTL ? "اختر أسلوب السيرة الذاتية" : "Choose your bio style"}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BIO_STYLES.map((s) => (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-start transition-all",
                        style === s.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-border hover:border-violet-500/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {s.icon}
                        <span className="font-medium">{isRTL ? s.nameAr : s.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? s.descriptionAr : s.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">
                    {isRTL ? "الطول" : "Length"}
                  </Label>
                  <Select value={length} onValueChange={(v) => setLength(v as BioLength)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">{isRTL ? "قصير" : "Short"}</SelectItem>
                      <SelectItem value="medium">{isRTL ? "متوسط" : "Medium"}</SelectItem>
                      <SelectItem value="long">{isRTL ? "طويل" : "Long"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {isRTL ? "خيارات إضافية" : "Additional Options"}
                  </Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeEmoji}
                        onChange={(e) => setIncludeEmoji(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{isRTL ? "تضمين إيموجي" : "Include emojis"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCTA}
                        onChange={(e) => setIncludeCTA(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{isRTL ? "تضمين دعوة للعمل" : "Include CTA"}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  {isRTL ? "السابق" : "Back"}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  onClick={generateBios}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {isRTL ? "جاري التوليد..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 me-2" />
                      {isRTL ? "توليد" : "Generate"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {isRTL ? "اختر سيرتك الذاتية" : "Choose your bio"}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateBios}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("w-4 h-4 me-2", isGenerating && "animate-spin")} />
                  {isRTL ? "إعادة التوليد" : "Regenerate"}
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pe-2">
                {generatedBios.map((bio, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedBio(bio)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedBio === bio
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-500/50"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{bio}</p>
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(bio); }}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  {isRTL ? "تعديل الخيارات" : "Edit Options"}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  onClick={() => selectedBio && handleUseBio(selectedBio)}
                  disabled={!selectedBio}
                >
                  <Check className="w-4 h-4 me-2" />
                  {isRTL ? "استخدام هذه السيرة" : "Use This Bio"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default AIBioGenerator;
