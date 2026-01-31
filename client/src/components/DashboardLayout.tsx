import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  LinkIcon,
  BarChart3,
  User,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  CreditCard,
  Shield,
  Users,
  FileText,
  Bell,
  Activity,
  Cog,
  ChevronDown,
  Palette,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
  isAdmin?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { userProfile, logout, isAdmin } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminSectionOpen, setAdminSectionOpen] = useState(true);
  const isRTL = i18n.language === "ar";

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // User menu items
  const userMenuItems: MenuItem[] = [
    { id: "dashboard", label: t("common.dashboard"), icon: LayoutDashboard, path: "/dashboard" },
    { id: "links", label: t("common.links"), icon: LinkIcon, path: "/dashboard/links" },
    { id: "analytics", label: t("common.analytics"), icon: BarChart3, path: "/dashboard/analytics" },
    { id: "profile", label: t("common.profile"), icon: User, path: "/dashboard/profile" },
    { id: "subscriptions", label: isRTL ? "الاشتراكات" : "Subscriptions", icon: CreditCard, path: "/dashboard/subscriptions" },
    { id: "settings", label: t("common.settings"), icon: Settings, path: "/dashboard/settings" },
  ];

  // Admin menu items
  const adminMenuItems: MenuItem[] = [
    { id: "admin-dashboard", label: isRTL ? "لوحة الإدارة" : "Admin Dashboard", icon: Shield, path: "/admin", isAdmin: true },
    { id: "admin-users", label: isRTL ? "إدارة المستخدمين" : "User Management", icon: Users, path: "/admin/users", isAdmin: true },
    { id: "admin-analytics", label: isRTL ? "تحليلات المنصة" : "Platform Analytics", icon: Activity, path: "/admin/analytics", isAdmin: true },
    { id: "admin-content", label: isRTL ? "إدارة المحتوى" : "Content Management", icon: FileText, path: "/admin/content", isAdmin: true },
    { id: "admin-settings", label: isRTL ? "إعدادات النظام" : "System Settings", icon: Cog, path: "/admin/settings", isAdmin: true },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Responsive sidebar width
  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? 280 : 72);

  const renderMenuItem = (item: MenuItem, collapsed: boolean = false) => {
    const isActive = location === item.path || (item.path !== "/dashboard" && item.path !== "/admin" && location.startsWith(item.path));
    
    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={`
          w-full gap-3 h-11 transition-all duration-200
          ${collapsed ? "justify-center px-0" : "justify-start px-4"}
          ${item.isAdmin ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20' : ''}
          ${isActive && item.isAdmin ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
        `}
        title={collapsed ? item.label : ""}
        onClick={() => setLocation(item.path)}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"} ${item.isAdmin && !isActive ? 'text-purple-500 dark:text-purple-400' : ''}`} />
        {!collapsed && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-start">
            {item.label}
          </span>
        )}
        {!collapsed && item.badge && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {item.badge}
          </Badge>
        )}
      </Button>
    );
  };

  return (
    <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 z-50 bg-card border-e transition-all duration-300 hidden lg:flex flex-col shadow-sm`}
        style={{
          width: sidebarWidth,
          [isRTL ? 'right' : 'left']: 0,
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0">
          {isSidebarOpen ? (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UniLink
              </span>
            </Link>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto flex-shrink-0 shadow-lg shadow-blue-500/20">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex-shrink-0 ${!isSidebarOpen ? 'hidden' : ''}`}
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation - with proper scrolling */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="h-full px-3 py-4">
            {/* User Menu */}
            <nav className="space-y-1 mb-4">
              {userMenuItems.map((item) => renderMenuItem(item, !isSidebarOpen))}
            </nav>

            {/* Admin Section - Collapsible */}
            {isAdmin && (
              <div className="mt-6">
                <Collapsible open={adminSectionOpen} onOpenChange={setAdminSectionOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full gap-3 h-10 transition-all duration-200 ${
                        isSidebarOpen ? "justify-between px-4" : "justify-center px-0"
                      }`}
                      title={isSidebarOpen ? "" : isRTL ? "الإدارة" : "Administration"}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                        {isSidebarOpen && (
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {isRTL ? "الإدارة" : "Administration"}
                          </span>
                        )}
                      </div>
                      {isSidebarOpen && (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${adminSectionOpen ? "rotate-180" : ""}`} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2">
                    {adminMenuItems.map((item) => renderMenuItem(item, !isSidebarOpen))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-3 border-t space-y-1 flex-shrink-0">
          {/* User Profile */}
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-muted/50">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={userProfile?.photoURL} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {userProfile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {userProfile?.displayName || userProfile?.username}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {userProfile?.email}
                </span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className={`w-full gap-3 h-10 ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"}`}
            onClick={toggleTheme}
            title={isSidebarOpen ? "" : theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            {isSidebarOpen && (
              <span className="whitespace-nowrap">
                {theme === "dark" ? (isRTL ? "الوضع الفاتح" : "Light Mode") : (isRTL ? "الوضع الليلي" : "Dark Mode")}
              </span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full gap-3 h-10 ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"}`}
            onClick={toggleLanguage}
            title={isSidebarOpen ? "" : i18n.language === "en" ? "العربية" : "English"}
          >
            <Globe className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">
                {i18n.language === "en" ? "العربية" : "English"}
              </span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10 ${
              isSidebarOpen ? "justify-start px-4" : "justify-center px-0"
            }`}
            onClick={handleLogout}
            title={isSidebarOpen ? "" : t("common.logout")}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">{t("common.logout")}</span>}
          </Button>
        </div>

        {/* Collapse Toggle (when collapsed) */}
        {!isSidebarOpen && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="w-full"
              title={isRTL ? "فتح القائمة" : "Expand Menu"}
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-md border-b z-40 px-3 flex items-center justify-between safe-area-inset">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <LinkIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            UniLink
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="h-10 w-10">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside 
            className={`fixed inset-y-0 w-[85%] max-w-[320px] bg-card shadow-2xl flex flex-col animate-in slide-in-from-left duration-300`}
            style={{
              [isRTL ? 'right' : 'left']: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0">
              <span className="font-bold text-lg">{isRTL ? "القائمة" : "Menu"}</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="h-10 w-10">
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={userProfile?.photoURL} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                    {userProfile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {userProfile?.displayName || userProfile?.username}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {userProfile?.email}
                  </span>
                  {isAdmin && (
                    <Badge variant="secondary" className="w-fit mt-1 text-xs">
                      {isRTL ? "مسؤول" : "Admin"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {/* User Menu */}
                <nav className="space-y-1 mb-4">
                  {userMenuItems.map((item) => renderMenuItem(item, false))}
                </nav>

                {/* Admin Section */}
                {isAdmin && (
                  <div className="mt-6">
                    <Collapsible open={adminSectionOpen} onOpenChange={setAdminSectionOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full gap-3 h-10 justify-between px-4"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                              {isRTL ? "الإدارة" : "Administration"}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${adminSectionOpen ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-2">
                        {adminMenuItems.map((item) => renderMenuItem(item, false))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Actions */}
            <div className="p-3 border-t space-y-1 flex-shrink-0 safe-area-inset-bottom">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 px-4 h-12 text-base" 
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
                <span>{theme === "dark" ? (isRTL ? "الوضع الفاتح" : "Light Mode") : (isRTL ? "الوضع الليلي" : "Dark Mode")}</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 px-4 h-12 text-base" 
                onClick={toggleLanguage}
              >
                <Globe className="w-5 h-5 flex-shrink-0" />
                <span>{i18n.language === "en" ? "العربية" : "English"}</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>{t("common.logout")}</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          paddingTop: isMobile ? '3.5rem' : 0,
          [isRTL ? 'paddingRight' : 'paddingLeft']: isMobile ? 0 : sidebarWidth,
        }}
      >
        <div className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
