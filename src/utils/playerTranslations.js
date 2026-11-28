import { useLanguage } from "../context/LanguageContext";

const translations = {
  English: {
    nowPlaying: "NOW PLAYING", play: "Play", pause: "Pause", previous: "Previous song",
    next: "Next song", shuffle: "Shuffle", repeat: "Repeat", lyrics: "Lyrics",
    queue: "Queue", like: "Add to liked songs", liked: "Liked", rewind: "Rewind 10 seconds",
    forward: "Forward 10 seconds", volume: "Volume", close: "Close player",
  },
  Telugu: {
    nowPlaying: "ఇప్పుడు ప్లే అవుతోంది", play: "ప్లే చేయండి", pause: "పాజ్ చేయండి",
    previous: "మునుపటి పాట", next: "తదుపరి పాట", shuffle: "షఫుల్", repeat: "రిపీట్",
    lyrics: "పాటల సాహిత్యం", queue: "పాటల క్యూ", like: "ఇష్టమైన పాటల్లో చేర్చండి",
    liked: "ఇష్టమైనది", rewind: "10 సెకన్లు వెనక్కి", forward: "10 సెకన్లు ముందుకు",
    volume: "వాల్యూమ్", close: "ప్లేయర్ మూసివేయండి",
  },
  Hindi: {
    nowPlaying: "अभी चल रहा है", play: "चलाएँ", pause: "रोकें", previous: "पिछला गाना",
    next: "अगला गाना", shuffle: "शफल", repeat: "दोहराएँ", lyrics: "गीत के बोल",
    queue: "गीत सूची", like: "पसंद किए गए गीतों में जोड़ें", liked: "पसंद किया",
    rewind: "10 सेकंड पीछे", forward: "10 सेकंड आगे", volume: "आवाज़", close: "प्लेयर बंद करें",
  },
  Malayalam: {
    nowPlaying: "ഇപ്പോൾ പ്ലേ ചെയ്യുന്നു", play: "പ്ലേ ചെയ്യുക", pause: "നിർത്തുക",
    previous: "മുമ്പത്തെ പാട്ട്", next: "അടുത്ത പാട്ട്", shuffle: "ഷഫിൾ", repeat: "ആവർത്തിക്കുക",
    lyrics: "വരികൾ", queue: "പാട്ടുകളുടെ പട്ടിക", like: "ഇഷ്ടപ്പെട്ടവയിൽ ചേർക്കുക",
    liked: "ഇഷ്ടപ്പെട്ടു", rewind: "10 സെക്കൻഡ് പിന്നോട്ട്", forward: "10 സെക്കൻഡ് മുന്നോട്ട്",
    volume: "ശബ്ദം", close: "പ്ലെയർ അടയ്ക്കുക",
  },
  Kannada: {
    nowPlaying: "ಈಗ ಪ್ಲೇ ಆಗುತ್ತಿದೆ", play: "ಪ್ಲೇ ಮಾಡಿ", pause: "ವಿರಾಮ",
    previous: "ಹಿಂದಿನ ಹಾಡು", next: "ಮುಂದಿನ ಹಾಡು", shuffle: "ಶಫಲ್", repeat: "ಮರುಕಳಿಸಿ",
    lyrics: "ಸಾಹಿತ್ಯ", queue: "ಹಾಡುಗಳ ಸರತಿ", like: "ಮೆಚ್ಚಿನ ಹಾಡುಗಳಿಗೆ ಸೇರಿಸಿ",
    liked: "ಮೆಚ್ಚಿನದು", rewind: "10 ಸೆಕೆಂಡ್ ಹಿಂದಕ್ಕೆ", forward: "10 ಸೆಕೆಂಡ್ ಮುಂದೆ",
    volume: "ಧ್ವನಿ", close: "ಪ್ಲೇಯರ್ ಮುಚ್ಚಿ",
  },
  Tamil: {
    nowPlaying: "இப்போது ஒலிக்கிறது", play: "இயக்கு", pause: "இடைநிறுத்து",
    previous: "முந்தைய பாடல்", next: "அடுத்த பாடல்", shuffle: "கலக்கு", repeat: "மீண்டும் இயக்கு",
    lyrics: "பாடல் வரிகள்", queue: "பாடல் வரிசை", like: "விருப்பப் பாடல்களில் சேர்",
    liked: "விருப்பமானது", rewind: "10 வினாடிகள் பின்னோக்கி", forward: "10 வினாடிகள் முன்னோக்கி",
    volume: "ஒலி அளவு", close: "பிளேயரை மூடு",
  },
};

export function translate(language, key) {
  return translations[language]?.[key] || translations.English[key] || key;
}

export function usePlayerTranslations() {
  const { selectedLanguage } = useLanguage();
  return (key) => translate(selectedLanguage, key);
}

export default translations;
