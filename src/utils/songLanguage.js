const LANGUAGE_LABELS = {
  te: "Telugu", telugu: "Telugu",
  hi: "Hindi", hindi: "Hindi",
  en: "English", english: "English",
  ml: "Malayalam", malayalam: "Malayalam",
  kn: "Kannada", kannada: "Kannada",
  ta: "Tamil", tamil: "Tamil",
};

export function getSongLanguage(song) {
  if (!song || typeof song !== "object") return "";
  const candidates = [
    song.language, song.language_name, song.languageName,
    song.language_code, song.languageCode, song.primary_language,
    song.primaryLanguage, song.content_language, song.contentLanguage,
    song.lang,
  ];
  for (const candidate of candidates) {
    const raw = typeof candidate === "object" && candidate !== null
      ? candidate.name_english || candidate.english_name || candidate.name ||
        candidate.label || candidate.language || candidate.language_name ||
        candidate.code || candidate.locale || ""
      : candidate;
    const value = String(raw || "").trim();
    if (!value) continue;
    const normalized = value.toLowerCase().replace(/_/g, "-");
    const code = normalized.split("-")[0];
    return LANGUAGE_LABELS[normalized] || LANGUAGE_LABELS[code] ||
      value.charAt(0).toUpperCase() + value.slice(1);
  }
  return "";
}
