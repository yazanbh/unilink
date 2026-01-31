import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { deleteUser } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { userProfile, firebaseUser, loading: authLoading, logout } = useFirebaseAuth();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!authLoading && !userProfile) {
      setLocation("/login");
    }
  }, [authLoading, userProfile, setLocation]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("auth.weakPassword"));
      return;
    }

    if (!firebaseUser || !firebaseUser.email) {
      toast.error("Unable to change password");
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userProfile) return;

    setDeleting(true);
    try {
      await deleteUser(userProfile.uid);
      await logout();
      toast.success("Account deleted successfully");
      setLocation("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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

  const isEmailUser = firebaseUser?.providerData.some(
    (provider) => provider.providerId === "password"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("common.settings")}</h1>
        <p className="text-muted-foreground mt-2">
          {isRTL ? "إدارة إعدادات حسابك والأمان." : "Manage your account settings and security."}
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "معلومات الحساب" : "Account Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input value={userProfile.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.username")}</Label>
              <Input value={userProfile.username} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {isEmailUser && (
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "تغيير كلمة المرور" : "Change Password"}</CardTitle>
              <CardDescription>{isRTL ? "قم بتحديث كلمة مرور حسابك" : "Update your account password"}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{isRTL ? "كلمة المرور الحالية" : "Current Password"}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{isRTL ? "كلمة المرور الجديدة" : "New Password"}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {changingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    isRTL ? "تغيير كلمة المرور" : "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {isRTL ? "منطقة الخطر" : "Danger Zone"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إجراءات لا يمكن التراجع عنها" : "Irreversible and destructive actions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/10">
              <div>
                <p className="font-medium text-destructive">{isRTL ? "حذف الحساب" : "Delete Account"}</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "حذف حسابك وجميع بياناتك بشكل دائم" : "Permanently delete your account and all associated data"}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                {isRTL ? "حذف الحساب" : "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "هل أنت متأكد تماماً؟" : "Are you absolutely sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? "لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف حسابك نهائياً وإزالة جميع بياناتك بما في ذلك ملفك الشخصي وروابطك وتحليلاتك."
                : "This action cannot be undone. This will permanently delete your account and remove all your data including your profile, links, and analytics."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isRTL ? "حذف الحساب" : "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
