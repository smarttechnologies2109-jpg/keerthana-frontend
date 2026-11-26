import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LanguageContext = createContext(null);

export const LANGUAGE_STORAGE_KEY = "keerthana_language";
export const LEGACY_LANGUAGE_STORAGE_KEY = "language";
export const LANGUAGE_CHANGE_EVENT = "keerthana:language-change";

export const SUPPORTED_LANGUAGES = [
  { value: "Telugu", label: "తెలుగు", code: "te" },
  { value: "Hindi", label: "हिन्दी", code: "hi" },
  { value: "English", label: "English", code: "en" },
  { value: "Malayalam", label: "മലയാളം", code: "ml" },
  { value: "Kannada", label: "ಕನ್ನಡ", code: "kn" },
  { value: "Tamil", label: "தமிழ்", code: "ta" },
];

const LANGUAGE_ALIASES = {
  te: "Telugu", "te-in": "Telugu", telugu: "Telugu", "తెలుగు": "Telugu",
  hi: "Hindi", "hi-in": "Hindi", hindi: "Hindi", "हिन्दी": "Hindi", "हिंदी": "Hindi",
  en: "English", "en-in": "English", english: "English",
  ml: "Malayalam", "ml-in": "Malayalam", malayalam: "Malayalam", "മലയാളം": "Malayalam",
  kn: "Kannada", "kn-in": "Kannada", kannada: "Kannada", "ಕನ್ನಡ": "Kannada",
  ta: "Tamil", "ta-in": "Tamil", tamil: "Tamil", "தமிழ்": "Tamil",
};

export const normalizeLanguage = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  return LANGUAGE_ALIASES[raw] || "Telugu";
};

const getProfileLanguage = () => {
  if (typeof window === "undefined") return "";

  try {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return "";
    const user = JSON.parse(savedUser);
    return (
      user?.preferred_language ||
      user?.preferredLanguage ||
      user?.language ||
      ""
    );
  } catch {
    return "";
  }
};

/*
 * Priority:
 * 1. Explicit app language selection.
 * 2. Account preference (first login / first device setup).
 * 3. Legacy saved language.
 * 4. Telugu default.
 */
const readStoredLanguage = () => {
  if (typeof window === "undefined") return "Telugu";

  const appLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (appLanguage) return normalizeLanguage(appLanguage);

  const profileLanguage = getProfileLanguage();
  if (profileLanguage) return normalizeLanguage(profileLanguage);

  const legacyLanguage = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (legacyLanguage) return normalizeLanguage(legacyLanguage);

  return "Telugu";
};

const saveLanguage = (language) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, language);
};

export function LanguageProvider({ children }) {
  const [selectedLanguage, setSelectedLanguageState] = useState(readStoredLanguage);

  const setSelectedLanguage = useCallback((value) => {
    const language = normalizeLanguage(value);
    setSelectedLanguageState(language);
    saveLanguage(language);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(LANGUAGE_CHANGE_EVENT, {
          detail: { language },
        })
      );
    }
  }, []);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      const language =
        event?.detail?.language ||
        localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);

      if (language) {
        setSelectedLanguageState(normalizeLanguage(language));
      }
    };

    const handleStorage = (event) => {
      if (
        event.key === LANGUAGE_STORAGE_KEY ||
        event.key === LEGACY_LANGUAGE_STORAGE_KEY ||
        event.key === "user"
      ) {
        setSelectedLanguageState(readStoredLanguage());
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      selectedLanguage,
      setSelectedLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [selectedLanguage, setSelectedLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

export default LanguageContext;
