import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Link2,
  BarChart3,
  Palette,
  Shield,
  ArrowRight,
  Check,
  Globe,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
  const isRTL = i18n.language === "ar";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const plans = [
    {
      id: "free",
      name: isRTL ? "مجاني" : "Free",
      price: 0,
      features: [
        isRTL ? "روابط غير محدودة" : "Unlimited links",
        isRTL ? "تحليلات أساسية" : "Basic analytics",
        isRTL ? "ثيم افتراضي" : "Default theme",
      ],
    },
    {
      id: "pro",
      name: isRTL ? "برو" : "Pro",
      price: 9,
      features: [
        isRTL ? "كل ميزات المجاني" : "All Free features",
        isRTL ? "تحليلات متقدمة" : "Advanced analytics",
        isRTL ? "ثيمات مخصصة" : "Custom themes",
        isRTL ? "إزالة شعار UniLink" : "Remove UniLink branding",
      ],
    },
    {
      id: "business",
      name: isRTL ? "بيزنس" : "Business",
      price: 29,
      features: [
        isRTL ? "كل ميزات برو" : "All Pro features",
        isRTL ? "نطاق مخصص" : "Custom domain",
        isRTL ? "إدارة فرق العمل" : "Team management",
        isRTL ? "دعم مخصص 24/7" : "24/7 Dedicated support",
      ],
    },
  ];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`}>
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UniLink
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {isRTL ? "الميزات" : "Features"}
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {isRTL ? "الأسعار" : "Pricing"}
              </a>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
                <Globe className="w-4 h-4" />
                {i18n.language === "en" ? "العربية" : "English"}
              </Button>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {isRTL ? "لوحة التحكم" : "Dashboard"}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t("common.login")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      {t("common.register")}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background">
            <a href="#features" className="block text-sm font-medium p-2" onClick={() => setMobileMenuOpen(false)}>
              {isRTL ? "الميزات" : "Features"}
            </a>
            <a href="#pricing" className="block text-sm font-medium p-2" onClick={() => setMobileMenuOpen(false)}>
              {isRTL ? "الأسعار" : "Pricing"}
            </a>
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="w-full justify-start gap-2">
              <Globe className="w-4 h-4" />
              {i18n.language === "en" ? "العربية" : "English"}
            </Button>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    {isRTL ? "لوحة التحكم" : "Dashboard"}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      {t("common.login")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      {t("common.register")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              {t("landing.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {t("landing.getStarted")}
                  <ArrowRight className={`ms-2 w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                  {t("landing.learnMore")}
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{isRTL ? "كل ما تحتاجه في مكان واحد" : "Everything you need in one place"}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL ? "أدوات قوية لمساعدتك على تنمية حضورك الرقمي وتتبع أدائك." : "Powerful tools to help you grow your digital presence and track your performance."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: t("landing.feature1Title"),
                desc: t("landing.feature1Desc"),
                icon: Link2,
                color: "text-blue-600",
                bg: "bg-blue-100 dark:bg-blue-900/30",
              },
              {
                title: t("landing.feature2Title"),
                desc: t("landing.feature2Desc"),
                icon: BarChart3,
                color: "text-purple-600",
                bg: "bg-purple-100 dark:bg-purple-900/30",
              },
              {
                title: t("landing.feature3Title"),
                desc: t("landing.feature3Desc"),
                icon: Palette,
                color: "text-pink-600",
                bg: "bg-pink-100 dark:bg-pink-900/30",
              },
              {
                title: t("landing.feature4Title"),
                desc: t("landing.feature4Desc"),
                icon: Shield,
                color: "text-green-600",
                bg: "bg-green-100 dark:bg-green-900/30",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{isRTL ? "خطط بسيطة وشفافة" : "Simple, Transparent Pricing"}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL ? "اختر الخطة التي تناسب احتياجاتك. ابدأ مجاناً وقم بالترقية في أي وقت." : "Choose the plan that fits your needs. Start for free and upgrade anytime."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.id} className={`flex flex-col ${plan.id === "pro" ? "border-primary shadow-xl scale-105" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{isRTL ? "شهرياً" : "month"}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link href="/register">
                    <Button className="w-full" variant={plan.id === "pro" ? "default" : "outline"}>
                      {isRTL ? "ابدأ الآن" : "Get Started"}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">UniLink</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} UniLink. {isRTL ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
