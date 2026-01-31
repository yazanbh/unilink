import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getUserByUsername,
  getUserLinks,
  incrementViews,
  incrementClicks,
  type UserProfile,
  type Link as LinkType,
} from "@/lib/firebase";
import { Link2, User, ExternalLink, AlertTriangle, Loader2, Share2, QrCode, MapPin, Calendar, Verified } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PROFILE_THEMES, type ProfileTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
} as const;

const linkVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
  hover: {
    scale: 1.03,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.98,
  },
} as const;

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    },
  },
} as const;

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ username: string }>();
  const username = params.username;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [theme, setTheme] = useState<ProfileTheme>(PROFILE_THEMES[0]);
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      try {
        const userProfile = await getUserByUsername(username);
        
        if (!userProfile) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (userProfile.status === "suspended") {
          setSuspended(true);
          setLoading(false);
          return;
        }

        setProfile(userProfile);
        
        // Apply theme if set
        const currentThemeId = userProfile.themeId || userProfile.theme;
        if (currentThemeId) {
          const selectedTheme = PROFILE_THEMES.find(t => t.id === currentThemeId);
          if (selectedTheme) setTheme(selectedTheme);
        }
        
        // Set language direction based on user preference
        if (userProfile.lang) {
          i18n.changeLanguage(userProfile.lang);
          document.documentElement.dir = userProfile.lang === "ar" ? "rtl" : "ltr";
        }

        // Fetch links
        const userLinks = await getUserLinks(userProfile.uid);
        setLinks(userLinks.filter((link) => link.enabled));

        // Track view (non-blocking)
        incrementViews(userProfile.uid).catch((error) => {
          console.warn("Failed to track view (non-critical):", error);
        })
      } catch (error) {
        console.error("Error fetching profile:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, i18n]);

  const handleLinkClick = async (link: LinkType) => {
    if (!profile) return;
    
    setClickedLink(link.id);
    
    // Open link in new tab immediately
    window.open(link.url, "_blank", "noopener,noreferrer");
    
    // Track click (non-blocking)
    incrementClicks(profile.uid, link.id).catch((error) => {
      console.warn("Failed to track click (non-critical):", error);
    });

    setTimeout(() => setClickedLink(null), 300);
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.displayName || profile?.username,
          text: profile?.bio || `Check out ${profile?.displayName}'s links`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(i18n.language === "ar" ? "تم نسخ الرابط!" : "Link copied!");
    }
  };

  const isRTL = profile?.lang === "ar" || i18n.language === "ar";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-md space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col items-center">
            <Skeleton className="w-28 h-28 rounded-full mb-4" />
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 200 }}
          >
            <User className="w-12 h-12 text-muted-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">
            {t("publicProfile.profileNotFound")}
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">
            The profile @{username} does not exist
          </p>
          <Link href="/">
            <Button variant="outline" size="lg">
              {t("errors.goHome")}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (suspended) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 200 }}
          >
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">
            {t("publicProfile.accountSuspended")}
          </h1>
          <Link href="/">
            <Button variant="outline" size="lg" className="mt-4">
              {t("errors.goHome")}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} ${isRTL ? "rtl" : "ltr"} transition-all duration-700 ${theme.animation || ""}`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Share Button - Fixed */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleShare}
        className="fixed top-4 end-4 z-50 w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"
      >
        <Share2 className="w-5 h-5" />
      </motion.button>

      <motion.div 
        className="relative z-10 max-w-lg mx-auto px-4 py-12 md:py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Header */}
        <motion.div className="text-center mb-10" variants={itemVariants}>
          {/* Avatar with Ring Animation */}
          <motion.div 
            className="relative inline-block mb-6"
            variants={avatarVariants}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin-slow opacity-70 blur-sm scale-110" />
            <Avatar className="w-32 h-32 relative ring-4 ring-white/30 shadow-2xl">
              <AvatarImage src={profile.photoURL} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                {profile.displayName?.charAt(0) || profile.username?.charAt(0) || <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
            
            {/* Verified Badge */}
            {profile.plan !== "free" && (
              <motion.div 
                className="absolute -bottom-1 -end-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ring-4 ring-white/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" as const }}
              >
                <Verified className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </motion.div>
          
          {/* Name */}
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-2"
            variants={itemVariants}
          >
            {profile.displayName || profile.username}
          </motion.h1>
          
          {/* Username */}
          <motion.p 
            className="text-lg opacity-70 mb-4"
            variants={itemVariants}
          >
            @{profile.username}
          </motion.p>
          
          {/* Bio */}
          {profile.bio && (
            <motion.p 
              className="max-w-md mx-auto text-lg opacity-90 leading-relaxed"
              variants={itemVariants}
            >
              {profile.bio}
            </motion.p>
          )}
        </motion.div>

        {/* Links */}
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
        >
          {links.length === 0 ? (
            <motion.div 
              className="text-center py-12 opacity-60"
              variants={itemVariants}
            >
              <Link2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No links yet</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {links.map((link, index) => (
                <motion.button
                  key={link.id}
                  variants={linkVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleLinkClick(link)}
                  className={`
                    profile-link-btn w-full ${theme.card} border backdrop-blur-md 
                    ${theme.buttonRadius} py-5 px-6 text-center font-semibold 
                    transition-all duration-300 flex items-center justify-center gap-3 
                    ${theme.buttonStyle || "shadow-lg hover:shadow-2xl"}
                    ${clickedLink === link.id ? "scale-95" : ""}
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {/* Link Icon (if available) */}
                  {link.icon && (
                    <span className="text-xl">{link.icon}</span>
                  )}
                  
                  <span className="flex-1">{link.title}</span>
                  
                  {/* External Link Icon */}
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="mt-16 text-center"
          variants={itemVariants}
        >
          <Link href="/">
            <motion.a 
              className="inline-flex items-center gap-3 text-sm opacity-50 hover:opacity-100 transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-full px-5 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">
                {t("publicProfile.poweredBy")} <span className="font-bold">UniLink</span>
              </span>
            </motion.a>
          </Link>
          
          {/* Create Your Own CTA */}
          <motion.p 
            className="mt-4 text-sm opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.5 }}
          >
            {isRTL ? "أنشئ صفحتك الخاصة مجاناً" : "Create your own page for free"}
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
