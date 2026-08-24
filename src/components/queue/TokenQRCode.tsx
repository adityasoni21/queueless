"use client";

import { QRCodeSVG } from "qrcode.react";

interface Props {
  tokenId: string;
  tokenNumber: string;
}

export default function TokenQRCode({
  tokenId,
  tokenNumber,
}: Props) {
  const checkInUrl =
    `${window.location.origin}/staff/check-in/${tokenId}`;

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6 text-center">
      <p className="font-semibold text-slate-900">
        Show this QR code at the counter
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Staff can scan it to confirm your arrival.
      </p>

      <div className="mt-5 flex justify-center">
        <QRCodeSVG
          value={checkInUrl}
          size={180}
          level="M"
        />
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Token {tokenNumber}
      </p>
    </div>
  );
}