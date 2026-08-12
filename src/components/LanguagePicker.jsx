import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import "./LanguagePicker.css";

const LANGUAGES = [
  { code: "en", label: "English - EN" },
  { code: "hi", label: "हिंदी - HI" },
  { code: "te", label: "తెలుగు - TE" },
  { code: "mr", label: "मराठी - MR" },
];

export default function LanguagePicker() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("jcs_lang") || "en");
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const select = (code) => {
    setLang(code);
    localStorage.setItem("jcs_lang", code);
    setOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="lang-wrap" ref={wrapRef}>
      <button className="lang-btn" onClick={() => setOpen((v) => !v)}>
        <Globe size={15} />
        <span>{current.label}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="lang-menu">
          {LANGUAGES.map((l) => (
            <button key={l.code} className="lang-item" onClick={() => select(l.code)}>
              {l.label}
              {l.code === lang && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}