import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  signUpWithEmail,
  signInWithGoogle,
  createUserProfile,
  checkUsernameAvailable,
  getUserProfile,
} from "@/lib/firebase";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link2, Loader2, Mail, User, Check, X, Globe, Moon, Sun, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { refreshProfile } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const [googleUid, setGoogleUid] = useState("");
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("google") === "true") {
      setIsGoogleSignUp(true);
      setGoogleUid(params.get("uid") || "");
      setEmail(params.get("email") || "");
      setDisplayName(params.get("name") || "");
    }
  }, [searchString]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // Username validation
  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      return;
    }

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      setUsernameStatus("invalid");
      return;
    }

    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus("checking");
      try {
        const available = await checkUsernameAvailable(username);
        setUsernameStatus(available ? "available" : "taken");
      } catch (error) {
        console.error("Username check error:", error);
        setUsernameStatus("idle");
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("auth.weakPassword"));
      return;
    }

    if (usernameStatus !== "available") {
      toast.error(t("auth.usernameTaken"));
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password);
      await createUserProfile(result.user.uid, email, username, displayName || username);
      
      await refreshProfile();
      toast.success("Account created successfully!");
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameStatus !== "available") {
      toast.error(t("auth.usernameTaken"));
      return;
    }

    setLoading(true);
    try {
      await createUserProfile(googleUid, email, username, displayName || username);
      
      await refreshProfile();
      toast.success("Account created successfully!");
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const profile = await getUserProfile(result.user.uid);
      
      if (profile) {
        // User already exists
        await refreshProfile();
        toast.success("Welcome back!");
        setLocation("/dashboard");
        return;
      }

      // New user, need to complete registration
      setIsGoogleSignUp(true);
      setGoogleUid(result.user.uid);
      setEmail(result.user.email || "");
      setDisplayName(result.user.displayName || "");
    } catch (error: any) {
      console.error("Google sign up error:", error);
      toast.error(t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case "available":
        return <Check className="w-4 h-4 text-green-500" />;
      case "taken":
      case "invalid":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case "available":
        return <span className="text-green-600 text-xs">{t("auth.usernameAvailable")}</span>;
      case "taken":
        return <span className="text-red-600 text-xs">{t("auth.usernameTaken")}</span>;
      case "invalid":
        return <span className="text-red-600 text-xs">{t("auth.usernameInvalid")}</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Header Controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === "en" ? "العربية" : "English"}
        </Button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            UniLink
          </span>
        </Link>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.registerTitle")}</CardTitle>
            <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isGoogleSignUp && (
              <>
                {/* Google Sign Up */}
                <Button
                  variant="outline"
                  className="w-full py-6 text-base"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin me-2" />
                  ) : (
                    <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {t("auth.signInWithGoogle")}
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                    {t("auth.orContinueWith")}
                  </span>
                </div>
              </>
            )}

            {/* Registration Form */}
            <form onSubmit={isGoogleSignUp ? handleGoogleComplete : handleEmailRegister} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <div className="relative">
                  <User className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={isRTL ? "pr-10 pl-10" : "pl-10 pr-10"}
                    style={{ textAlign: "left", direction: "ltr" }}
                    required
                  />
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}>
                    {getUsernameStatusIcon()}
                  </div>
                </div>
                {getUsernameStatusText()}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("profile.displayName")}</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              {!isGoogleSignUp && (
                <>
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}
                        style={{ textAlign: "left", direction: "ltr" }}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}
                        style={{ textAlign: "left", direction: "ltr" }}
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}
                        style={{ textAlign: "left", direction: "ltr" }}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full py-6 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading || (usernameStatus !== "available" && username !== "")}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t("common.register")
                )}
              </Button>
            </form>

            {!isGoogleSignUp && (
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t("common.login")}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
