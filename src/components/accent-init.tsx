"use client";

import { useEffect } from "react";
import { applyAccent, readStoredAccent } from "@/lib/accent";

export function AccentInit() {
  useEffect(() => {
    applyAccent(readStoredAccent());
  }, []);
  return null;
}
