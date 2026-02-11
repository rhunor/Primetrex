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
  const [showQR, setShowQR] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${appUrl}/register?ref=${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-heading text-foreground">
          Your Referral Link
        </h3>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
          {referralCode}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-muted px-4 py-3 font-mono text-sm text-foreground truncate">
          {referralLink}
        </div>
        <Button
          variant={copied ? "secondary" : "primary"}
          size="sm"
          onClick={handleCopy}
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
                <Check className="h-4 w-4" /> Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" /> Copy
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
            <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-white p-6 border border-border">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="h-4 w-4" />
          {showQR ? "Hide QR" : "QR Code"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Join Primetrex",
                text: "Start earning 50% commissions with Primetrex!",
                url: referralLink,
              });
            } else {
              handleCopy();
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Share Link
        </Button>
      </div>
    </motion.div>
  );
}
