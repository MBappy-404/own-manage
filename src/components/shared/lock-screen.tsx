"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Fingerprint, ChevronRight, AlertCircle, LogOut, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = React.useState("");
  const [showPin, setShowPin] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = React.useState(false);

  React.useEffect(() => {
    // Check for biometric support
    if (window.PublicKeyCredential) {
      (window.PublicKeyCredential as unknown as { isUserVerifyingPlatformAuthenticatorAvailable: () => Promise<boolean> }).isUserVerifyingPlatformAuthenticatorAvailable().then((available: boolean) => {
        setCanUseBiometrics(available);
      });
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length < 4) return;

    setIsVerifying(true);
    const success = await onUnlock(pin);
    if (!success) {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 500);
    }
    setIsVerifying(false);
  };

  const handleBiometric = async () => {
    // This is a simplified version. Real WebAuthn requires a challenge from server.
    // However, for a simple "App Lock", we might just use the PIN.
    // If the user wants real biometric, it's a larger implementation.
    // For now, we'll focus on the PIN and suggest PIN as primary.
    toast?.info("Biometric authentication requires setup. Use PIN for now.");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm p-8 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
          <Lock className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">App Locked</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your security PIN to continue
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
            <Input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className={cn(
                "text-center text-2xl tracking-[1em] h-14 bg-background/50 border-2 transition-all pr-12",
                error ? "border-destructive animate-shake" : "focus:border-primary"
              )}
              autoFocus
              maxLength={10}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1 text-destructive text-[10px] font-medium"
                >
                  <AlertCircle className="w-3 h-3" /> Incorrect PIN
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={pin.length < 4 || isVerifying}
              className="flex-1 h-12 rounded-xl text-lg font-bold"
            >
              Unlock <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            {canUseBiometrics && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBiometric}
                className="h-12 w-12 p-0 rounded-xl"
              >
                <Fingerprint className="w-6 h-6 text-primary" />
              </Button>
            )}
          </div>
        </form>

        <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-[240px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "delete"].map((key, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (key === "delete") setPin(p => p.slice(0, -1));
                else if (typeof key === "number") setPin(p => p + key);
              }}
              className={cn(
                "h-14 rounded-2xl flex items-center justify-center text-xl font-semibold transition-colors",
                key === "" ? "invisible" : "bg-accent/50 hover:bg-accent"
              )}
            >
              {key === "delete" ? "←" : key}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-8 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          <LogOut className="w-3 h-3" /> Logout from account
        </button>
      </motion.div>
    </div>
  );
}
