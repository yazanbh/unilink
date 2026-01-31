import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkIcon, Mail, ArrowLeft, Globe, Moon, Sun, Loader2, CheckCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const isRTL = i18n.language === "ar";

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(isRTL ? "يرجى إدخال البريد الإلكتروني" : "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success(isRTL ? "تم إرسال رابط إعادة تعيين كلمة المرور" : "Password reset link sent!");
    } catch (error: any) {
      console.error("Password reset error:", error);
      if (error.code === "auth/user-not-found") {
        toast.error(isRTL ? "لا يوجد حساب بهذا البريد الإلكتروني" : "No account found with this email");
      } else if (error.code === "auth/invalid-email") {
        toast.error(isRTL ? "البريد الإلكتروني غير صالح" : "Invalid email address");
      } else {
        toast.error(isRTL ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isRTL ? "rtl" : "ltr"}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-b z-40 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <LinkIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">UniLink</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleLanguage}>
            <Globe className="w-4 h-4 me-2" />
            {i18n.language === "en" ? "العربية" : "English"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">UniLink</span>
            </Link>
            <CardTitle className="text-2xl">
              {isRTL ? "نسيت كلمة المرور؟" : "Forgot Password?"}
            </CardTitle>
            <CardDescription>
              {isRTL 
                ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور" 
                : "Enter your email and we'll send you a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">
                  {isRTL ? "تم إرسال الرابط!" : "Link Sent!"}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL 
                    ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}` 
                    : `A password reset link has been sent to ${email}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? "تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها" 
                    : "Check your inbox or spam folder"}
                </p>
                <div className="pt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSent(false)}
                  >
                    {isRTL ? "إرسال مرة أخرى" : "Send Again"}
                  </Button>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    onClick={() => setLocation("/login")}
                  >
                    <ArrowLeft className="w-4 h-4 me-2" />
                    {isRTL ? "العودة لتسجيل الدخول" : "Back to Login"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isRTL ? "البريد الإلكتروني" : "Email"}</Label>
                  <div className="relative">
                    <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3"}`}
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {isRTL ? "جاري الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    isRTL ? "إرسال رابط إعادة التعيين" : "Send Reset Link"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? "العودة لتسجيل الدخول" : "Back to Login"}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
