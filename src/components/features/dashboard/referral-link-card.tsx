"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, QrCode, Download, TrendingUp, Users } from "lucide-react";

interface ReferralLinkCardProps {
  referralCode: string;
}

interface LinkSectionProps {
  label: string;
  sublabel: string;
  link: string;
  shareTitle: string;
  shareText: string;
  qrId: string;
  qrFilename: string;
}

function LinkSection({ label, sublabel, link, shareTitle, shareText, qrId, qrFilename }: LinkSectionProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showQR, setShowQR] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: link });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if ((err as Error).name !== "AbortError") handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  function handleDownloadQR() {
    const svg = document.getElementById(qrId);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = qrFilename;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sublabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-xl bg-muted px-3 py-2 font-mono text-xs text-foreground truncate">
          {link}
        </div>
        <Button
          variant={copied ? "secondary" : "primary"}
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy link"}
          className="shrink-0"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Copied
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                <Copy className="h-3.5 w-3.5" /> Copy
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-5 border border-border">
              <QRCodeSVG id={qrId} value={link} size={160} level="M" fgColor="#39005E" bgColor="#FFFFFF" />
              <p className="text-xs text-muted-foreground text-center">Scan to open your referral link</p>
              <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                <Download className="h-4 w-4" /> Download QR
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
          <QrCode className="h-4 w-4" />
          {showQR ? "Hide QR" : "QR Code"}
        </Button>
        <Button variant={shared ? "secondary" : "outline"} size="sm" onClick={handleShare}>
          <AnimatePresence mode="wait">
            {shared ? (
              <motion.span key="shared" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                <Check className="h-4 w-4" /> Shared!
              </motion.span>
            ) : (
              <motion.span key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                <Share2 className="h-4 w-4" /> Share
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}

export function ReferralLinkCard({ referralCode }: ReferralLinkCardProps) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const copyTradingLink = `${appUrl}/copy-trading?ref=${referralCode}`;
  const affiliateLink = `${appUrl}/register?ref=${referralCode}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Gradient header */}
      <div className="relative overflow-hidden gradient-primary px-5 py-4">
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-[20px]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -bottom-4 h-16 w-16 rounded-full bg-secondary/20 blur-[20px]" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Your referral links</p>
          <p className="mt-1 text-xs text-white/60">Share these links to earn commissions</p>
        </div>
      </div>

      {/* Links */}
      <div className="p-5 space-y-6">
        {/* Copy Trading link — prominent */}
        <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/20">
              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            </div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Copy Trading</span>
          </div>
          <LinkSection
            label="Copy Trading Referral Link"
            sublabel="Earn 40% when someone pays ₦50,000 for copy trading access"
            link={copyTradingLink}
            shareTitle="Join Primetrex Copy Trading"
            shareText="Get lifetime access to Primetrex Copy Trading for ₦50,000. Use my referral link:"
            qrId="copy-trading-qr-code"
            qrFilename={`primetrex-copy-trading-${referralCode}.png`}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Also</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Affiliate link — secondary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affiliate Program</span>
          </div>
          <LinkSection
            label="Affiliate Signup Link"
            sublabel="Earn 40% when someone pays the ₦10,000 signup fee + recurring commissions"
            link={affiliateLink}
            shareTitle="Join Primetrex — Earn Up to 40% Commission"
            shareText="I earn recurring commissions with Primetrex. Join using my affiliate link and start earning too!"
            qrId="affiliate-qr-code"
            qrFilename={`primetrex-affiliate-${referralCode}.png`}
          />
        </div>
      </div>
    </motion.div>
  );
}
