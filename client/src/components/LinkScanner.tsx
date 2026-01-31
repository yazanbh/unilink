import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkLinkSafety, type LinkScanResult } from "@/lib/firebase";

interface LinkScannerProps {
  url: string;
  onScanComplete?: (result: LinkScanResult) => void;
  showInline?: boolean;
  autoScan?: boolean;
}

export function LinkScannerInline({ url, onScanComplete, autoScan = true }: LinkScannerProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<LinkScanResult | null>(null);

  useEffect(() => {
    if (autoScan && url) {
      handleScan();
    }
  }, [url, autoScan]);

  const handleScan = async () => {
    if (!url) return;
    
    setScanning(true);
    try {
      const scanResult = await checkLinkSafety(url);
      setResult(scanResult);
      onScanComplete?.(scanResult);
    } catch (error) {
      console.error("Error scanning link:", error);
    } finally {
      setScanning(false);
    }
  };

  if (scanning) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">{isRTL ? "جاري الفحص..." : "Scanning..."}</span>
      </div>
    );
  }

  if (!result) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleScan}
        className="gap-1 h-7 text-xs"
      >
        <Shield className="w-3 h-3" />
        {isRTL ? "فحص" : "Scan"}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          {result.isSafe ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <ShieldCheck className="w-3 h-3" />
              {isRTL ? "آمن" : "Safe"}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <ShieldAlert className="w-3 h-3" />
              {isRTL ? "تحذير" : "Warning"}
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px]">
        {result.isSafe ? (
          <p>{isRTL ? "لم يتم اكتشاف أي تهديدات" : "No threats detected"}</p>
        ) : (
          <div className="space-y-1">
            <p className="font-medium">{isRTL ? "تم اكتشاف تهديدات:" : "Threats detected:"}</p>
            <ul className="text-xs space-y-0.5">
              {result.threats.map((threat, i) => (
                <li key={i}>• {threat}</li>
              ))}
            </ul>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface LinkScannerDialogProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
  onCancel?: () => void;
}

export function LinkScannerDialog({
  url,
  open,
  onOpenChange,
  onProceed,
  onCancel,
}: LinkScannerDialogProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<LinkScanResult | null>(null);

  useEffect(() => {
    if (open && url) {
      handleScan();
    }
  }, [open, url]);

  const handleScan = async () => {
    if (!url) return;
    
    setScanning(true);
    setResult(null);
    try {
      const scanResult = await checkLinkSafety(url);
      setResult(scanResult);
    } catch (error) {
      console.error("Error scanning link:", error);
    } finally {
      setScanning(false);
    }
  };

  const handleProceed = () => {
    onProceed?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", isRTL && "rtl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {isRTL ? "فحص أمان الرابط" : "Link Safety Check"}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? "نقوم بفحص الرابط للتأكد من سلامته"
              : "We're checking this link for potential threats"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* URL Display */}
          <div className="p-3 bg-muted rounded-lg mb-4">
            <p className="text-sm font-mono break-all">{url}</p>
          </div>

          {/* Scanning State */}
          {scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="relative">
                <Shield className="w-16 h-16 text-primary/20" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
              <p className="mt-4 text-muted-foreground">
                {isRTL ? "جاري فحص الرابط..." : "Scanning link..."}
              </p>
            </motion.div>
          )}

          {/* Result State */}
          {!scanning && result && (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {result.isSafe ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-200">
                      {isRTL ? "الرابط آمن" : "Link is Safe"}
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      {isRTL
                        ? "لم يتم اكتشاف أي تهديدات أمنية في هذا الرابط."
                        : "No security threats were detected in this link."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <ShieldAlert className="w-5 h-5" />
                    <AlertTitle>
                      {isRTL ? "تم اكتشاف تهديدات" : "Threats Detected"}
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1">
                        {result.threats.map((threat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Additional Info */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>
                      {isRTL
                        ? `تم الفحص في: ${result.checkedAt.toLocaleString("ar")}`
                        : `Checked at: ${result.checkedAt.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!scanning && result && (
            <>
              {result.isSafe ? (
                <Button onClick={handleProceed} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? "إضافة الرابط" : "Add Link"}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleProceed}
                    className="gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {isRTL ? "إضافة على أي حال" : "Add Anyway"}
                  </Button>
                </>
              )}
            </>
          )}
          {scanning && (
            <Button variant="outline" onClick={handleCancel}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk scanner for multiple links
interface BulkLinkScannerProps {
  links: Array<{ id: string; url: string; title: string }>;
  onComplete?: (results: Map<string, LinkScanResult>) => void;
}

export function BulkLinkScanner({ links, onComplete }: BulkLinkScannerProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Map<string, LinkScanResult>>(new Map());

  const handleScanAll = async () => {
    setScanning(true);
    setProgress(0);
    const newResults = new Map<string, LinkScanResult>();

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      try {
        const result = await checkLinkSafety(link.url);
        newResults.set(link.id, result);
      } catch (error) {
        console.error(`Error scanning ${link.url}:`, error);
      }
      setProgress(((i + 1) / links.length) * 100);
    }

    setResults(newResults);
    setScanning(false);
    onComplete?.(newResults);
  };

  const safeCount = Array.from(results.values()).filter((r) => r.isSafe).length;
  const unsafeCount = results.size - safeCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">
            {isRTL ? "فحص جميع الروابط" : "Scan All Links"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? `${links.length} رابط للفحص`
              : `${links.length} links to scan`}
          </p>
        </div>
        <Button
          onClick={handleScanAll}
          disabled={scanning || links.length === 0}
          className="gap-2"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {Math.round(progress)}%
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              {isRTL ? "فحص الكل" : "Scan All"}
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {scanning && (
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Results Summary */}
      {results.size > 0 && !scanning && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-600">
              {safeCount} {isRTL ? "آمن" : "Safe"}
            </span>
          </div>
          {unsafeCount > 0 && (
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-600">
                {unsafeCount} {isRTL ? "تحذير" : "Warning"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Individual Results */}
      {results.size > 0 && (
        <div className="space-y-2">
          {links.map((link) => {
            const result = results.get(link.id);
            if (!result) return null;

            return (
              <div
                key={link.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  result.isSafe
                    ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800"
                    : "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{link.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {link.url}
                  </p>
                </div>
                {result.isSafe ? (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                    <CheckCircle className="w-3 h-3" />
                    {isRTL ? "آمن" : "Safe"}
                  </Badge>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="gap-1 text-red-600 border-red-300 cursor-help">
                        <AlertTriangle className="w-3 h-3" />
                        {result.threats.length} {isRTL ? "تهديد" : "threat(s)"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <ul className="text-xs space-y-1">
                        {result.threats.map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LinkScannerDialog;
