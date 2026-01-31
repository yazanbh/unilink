import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, Loader2, Star, Zap, ShieldCheck, CreditCard, Apple, Smartphone } from "lucide-react";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { upgradeUserPlan } from "@/lib/subscriptions";
import { toast } from "sonner";

export default function Subscriptions() {
  const { t, i18n } = useTranslation();
  const { userProfile, refreshProfile, loading: authLoading } = useFirebaseAuth();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const isRTL = i18n.language === "ar";

  // Handle return from Tap Payments
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tap_id = urlParams.get('tap_id');
    
    if (tap_id && userProfile && !verifying) {
      const verifyAndActivate = async () => {
        setVerifying(true);
        try {
          console.log("SECURE_FIX: Verifying payment status for tap_id:", tap_id);
          
          const verifyUrl = `https://us-central1-unilink-b8936.cloudfunctions.net/verifyTapPayment`;
          
          const response = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tap_id })
          });

          const result = await response.json();

          if (result.success && result.status === "CAPTURED") {
            const pendingPlan = localStorage.getItem('pending_plan') || result.planId;
            if (pendingPlan) {
              console.log("SECURE_FIX: Payment verified! Activating plan:", pendingPlan);
              await upgradeUserPlan(userProfile.uid, pendingPlan as any);
              await refreshProfile();
              toast.success(isRTL ? "تم تفعيل اشتراكك بنجاح!" : "Your subscription has been activated!");
            }
          } else {
            console.warn("SECURE_FIX: Payment failed or cancelled. Status:", result.status);
            toast.error(isRTL ? "فشلت عملية الدفع أو تم إلغاؤها" : "Payment failed or was cancelled");
          }
          
          localStorage.removeItem('pending_plan');
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error("SECURE_FIX: Verification error:", error);
          toast.error(isRTL ? "حدث خطأ أثناء التحقق من الدفع" : "Error verifying payment");
        } finally {
          setVerifying(false);
        }
      };
      verifyAndActivate();
    }
  }, [userProfile, refreshProfile, isRTL]);

  if (authLoading || verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {verifying ? (isRTL ? "جاري التحقق من حالة الدفع..." : "Verifying payment status...") : ""}
        </p>
      </div>
    );
  }

  if (!userProfile) return null;

  const handleUpgrade = async (planId: string, price: number) => {
    if (userProfile.plan === planId) return;

    if (planId === "free") {
      setUpgrading("free");
      try {
        await upgradeUserPlan(userProfile.uid, "free");
        await refreshProfile();
        toast.success(isRTL ? "تم العودة للخطة المجانية" : "Plan downgraded to Free");
      } catch (error) {
        toast.error(isRTL ? "فشل تغيير الخطة" : "Failed to change plan");
      } finally {
        setUpgrading(null);
      }
      return;
    }

    setUpgrading(planId);
    console.log("SECURE_FIX: Initiating payment via Firebase Function for plan:", planId);
    
    try {
      localStorage.setItem('pending_plan', planId);
      
      const functionUrl = `https://us-central1-unilink-b8936.cloudfunctions.net/createTapCheckout`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: price,
          currency: "USD",
          planId: planId,
          redirectUrl: window.location.href,
          userId: userProfile.uid,
          email: userProfile.email,
          displayName: userProfile.displayName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }

      const result = await response.json();

      if (result?.url) {
        console.log("SECURE_FIX: Redirecting to:", result.url);
        toast.info(isRTL ? "جاري تحويلك لصفحة الدفع..." : "Redirecting to payment page...");
        window.location.href = result.url;
      } else {
        throw new Error("No redirect URL returned from server");
      }
    } catch (error: any) {
      console.error("SECURE_FIX: Payment initiation failed:", error);
      toast.error(isRTL ? "فشلت عملية الدفع: " + (error.message || "Unknown error") : "Payment failed: " + (error.message || "Unknown error"));
      setUpgrading(null);
      localStorage.removeItem('pending_plan');
    }
  };

  const plans = [
    {
      id: "free",
      name: isRTL ? "مجاني" : "Free",
      price: 0,
      icon: Zap,
      color: "text-slate-500",
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
      icon: Star,
      color: "text-blue-500",
      features: [
        isRTL ? "كل ميزات المجاني" : "All Free features",
        isRTL ? "تحليلات متقدمة" : "Advanced analytics",
        isRTL ? "ثيمات مخصصة" : "Custom themes",
        isRTL ? "إزالة شعار UniLink" : "Remove UniLink branding",
        isRTL ? "دعم ذو أولوية" : "Priority support",
      ],
    },
    {
      id: "business",
      name: isRTL ? "بيزنس" : "Business",
      price: 29,
      icon: ShieldCheck,
      color: "text-purple-500",
      features: [
        isRTL ? "كل ميزات برو" : "All Pro features",
        isRTL ? "نطاق مخصص" : "Custom domain",
        isRTL ? "إدارة فرق العمل" : "Team management",
        isRTL ? "دعم مخصص 24/7" : "24/7 Dedicated support",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{isRTL ? "خطط الاشتراك" : "Subscription Plans"}</h1>
        <p className="text-muted-foreground mt-2">
          {isRTL ? "اختر الخطة المناسبة لاحتياجاتك وقم بترقية حسابك." : "Choose the right plan for your needs and upgrade your account."}
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{isRTL ? "خطتك الحالية" : "Your Current Plan"}</p>
                <h3 className="text-2xl font-bold capitalize">{userProfile?.plan || "Free"}</h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = userProfile?.plan === plan.id;
          const Icon = plan.icon;
          return (
            <Card key={plan.id} className={`flex flex-col ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}>
              <CardHeader>
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2 ${plan.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/{isRTL ? "شهرياً" : "month"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || upgrading !== null}
                  onClick={() => handleUpgrade(plan.id, plan.price)}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    isRTL ? "خطتك الحالية" : "Current Plan"
                  ) : (
                    isRTL ? "ترقية الآن" : "Upgrade Now"
                  )}
                </Button>
                
                {plan.price > 0 && (
                  <div className="flex items-center justify-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <CreditCard className="w-5 h-5" />
                    <Apple className="w-5 h-5" />
                    <Smartphone className="w-5 h-5" />
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50 border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-sm">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{isRTL ? "دفع آمن عبر Tap Payments" : "Secure Payment via Tap Payments"}</h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "ندعم فيزا، ماستركارد، Apple Pay و Google Pay في الأردن." : "Supporting Visa, Mastercard, Apple Pay & Google Pay in Jordan."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img src="https://www.tap.company/img/tap-logo.svg" alt="Tap Payments" className="h-6 opacity-50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
