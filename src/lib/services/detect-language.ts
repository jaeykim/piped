// Lightweight language detection for ad copy generation. Counts characters
// in each script and picks the dominant one. Cheap, no deps, good enough
// for "is this a Korean site or an English site" decisions.

export type DetectedLanguage = "ko" | "ja" | "zh" | "en";

export function detectLanguage(text: string): DetectedLanguage {
  if (!text) return "en";

  let hangul = 0;
  let hiragana = 0;
  let katakana = 0;
  let cjk = 0;
  let latin = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) hangul++;
    else if (code >= 0x3040 && code <= 0x309f) hiragana++;
    else if (code >= 0x30a0 && code <= 0x30ff) katakana++;
    else if (code >= 0x4e00 && code <= 0x9fff) cjk++;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a))
      latin++;
  }

  // Korean: any meaningful amount of hangul wins
  if (hangul > 5) return "ko";
  // Japanese: kana presence is the giveaway (CJK alone could be Chinese)
  if (hiragana + katakana > 5) return "ja";
  // Chinese: CJK without kana
  if (cjk > 5 && hiragana + katakana === 0) return "zh";
  // Otherwise: assume English / Latin
  return latin > 0 ? "en" : "en";
}

export function languageLabel(lang: DetectedLanguage): string {
  switch (lang) {
    case "ko":
      return "한국어";
    case "ja":
      return "日本語";
    case "zh":
      return "中文";
    case "en":
      return "English";
  }
}

export function countryForLanguage(lang: DetectedLanguage): string {
  switch (lang) {
    case "ko":
      return "대한민국";
    case "ja":
      return "日本";
    case "zh":
      return "中国";
    case "en":
      return "United States";
  }
}
