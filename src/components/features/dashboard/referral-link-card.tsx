"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, QrCode, Download } from "lucide-react";

interface ReferralLinkCardProps {
  referralCode: string;
}

export function ReferralLinkCard({ referralCode }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${appUrl}/register?ref=${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Primetrex — Earn 50% Commission",
          text: "I earn recurring commissions with Primetrex copy trading. Join using my referral link and start earning too!",
          url: referralLink,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled (AbortError) — do nothing. Any other error: fall back to copy.
        if ((err as Error).name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      // Browser doesn't support Web Share API — copy to clipboard instead
      handleCopy();
    }
  }

  function handleDownloadQR() {
    const svg = document.getElementById("referral-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `primetrex-referral-${referralCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Gradient header — code displayed prominently */}
      <div className="relative overflow-hidden gradient-primary px-5 py-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-[20px]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -bottom-4 h-16 w-16 rounded-full bg-secondary/20 blur-[20px]" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Your referral code</p>
          <p className="mt-1 text-2xl font-bold font-mono tracking-widest text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
            {referralCode}
          </p>
          <p className="mt-1 text-[10px] text-white/30 truncate">{referralLink}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 rounded-xl bg-muted px-4 py-2.5 font-mono text-sm text-foreground truncate">
            {referralLink}
          </div>
          <Button
            variant={copied ? "secondary" : "primary"}
            size="sm"
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy referral link"}
            className="flex-shrink-0"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> Copied
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copy
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* QR Code Section */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 border border-border">
                <QRCodeSVG
                  id="referral-qr-code"
                  value={referralLink}
                  size={180}
                  level="M"
                  fgColor="#39005E"
                  bgColor="#FFFFFF"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Scan to open your referral link
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download QR
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
            <QrCode className="h-4 w-4" aria-hidden="true" />
            {showQR ? "Hide QR" : "QR Code"}
          </Button>
          <Button
            variant={shared ? "secondary" : "outline"}
            size="sm"
            onClick={handleShare}
            aria-label="Share referral link"
          >
            <AnimatePresence mode="wait">
              {shared ? (
                <motion.span
                  key="shared"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> Shared!
                </motion.span>
              ) : (
                <motion.span
                  key="share"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Share Link
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
