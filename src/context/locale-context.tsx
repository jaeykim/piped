"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAppText, type AppText } from "@/lib/i18n/app";

interface LocaleContextType {
  locale: string;
  t: AppText;
}

const fallback = getAppText("en");

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  t: fallback,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState("en");
  const [t, setT] = useState<AppText>(fallback);

  useEffect(() => {
    // Detect from browser language
    const browserLang = navigator.language?.split("-")[0] || "en";
    setLocale(browserLang);
    setT(getAppText(browserLang));
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
