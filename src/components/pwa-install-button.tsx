"use client";

import { useState, useEffect } from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

// Define a type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const { locale } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualInstruction, setShowManualInstruction] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to prevent flash
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we are already in standalone mode
    if (typeof window !== "undefined") {
      const isAppMode = window.matchMedia("(display-mode: standalone)").matches || 
                        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isAppMode);

      // Detect iOS & Mobile
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      
      setIsIOS(isIOSDevice && !isAppMode);
      setIsMobile(isMobileDevice);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If native prompt isn't available (e.g. in dev mode or Safari), show manual instructions
      setShowManualInstruction(true);
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || !isMobile) return null;

  return (
    <div className="flex flex-col items-center w-full sm:w-auto mt-4 sm:mt-0">
      <Button 
        onClick={handleInstallClick} 
        variant="premium" 
        size="lg" 
        className="w-full sm:w-auto animate-in fade-in slide-in-from-bottom-2 shadow-lg"
      >
        <Download className="w-4 h-4 mr-2" />
        {locale === "bn" ? "অ্যাপটি ইনস্টল করুন" : "Install App"}
        <Sparkles className="w-3.5 h-3.5 ml-1.5 text-yellow-300" />
      </Button>

      {/* Manual Instruction Fallback */}
      {(showManualInstruction || isIOS) && (
        <div className="mt-3 text-xs text-muted-foreground bg-card/60 border rounded-xl p-3 max-w-sm mx-auto sm:mx-0 animate-in fade-in">
          <p className="flex items-center justify-center gap-1.5 font-medium mb-1">
            <Download className="w-4 h-4" /> 
            {locale === "bn" ? "কীভাবে ইনস্টল করবেন" : "How to Install"}
          </p>
          <p className="text-center">
            {isIOS 
              ? (locale === "bn" ? 'সাফারি ব্রাউজারে "Share" আইকনে ক্লিক করে "Add to Home Screen" নির্বাচন করুন।' : 'Tap the "Share" icon in Safari and select "Add to Home Screen".')
              : (locale === "bn" ? 'আপনার ব্রাউজারের মেনু (⋮) থেকে "Install App" বা "Add to Home Screen" এ ক্লিক করুন।' : 'Tap your browser menu (⋮) and select "Install App" or "Add to Home Screen".')}
          </p>
        </div>
      )}
    </div>
  );
}
