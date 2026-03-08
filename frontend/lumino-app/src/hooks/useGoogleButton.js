import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "356032698202-a51919qlrad2bhf4384ldl429qan5nad.apps.googleusercontent.com";

export function useGoogleButton({ onCredential }) {
  const hostRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !hostRef.current) {
        return;
      }

      hostRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const credential = response?.credential || "";
          onCredential?.(credential);
        },
      });

      window.google.accounts.id.renderButton(hostRef.current, {
        theme: "outline",
        size: "large",
        width: 580,
        text: "continue_with",
        shape: "rectangular",
      });

      setGoogleReady(true);
    };

    const existingScript = document.querySelector('script[data-google-gsi="true"]');

    if (existingScript) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.onload = renderGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [onCredential]);

  return { hostRef, googleReady };
}
