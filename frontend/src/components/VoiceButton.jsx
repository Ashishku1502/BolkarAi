import { useEffect, useRef, useState } from "react";

/**
 * Voice input via the browser's built-in SpeechRecognition API.
 * No backend speech-to-text needed for the MVP - Chrome/Edge support
 * this natively. Swap for a server-side STT service (e.g. Whisper)
 * later if you need broader browser support or higher accuracy.
 */
export default function VoiceButton({ onResult, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <button
      type="button"
      className={`voice-btn${listening ? " voice-btn--active" : ""}`}
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop voice input" : "Ask by voice"}
      title={listening ? "Listening… click to stop" : "Ask by voice"}
    >
      {listening ? "● listening" : "🎙"}
    </button>
  );
}
