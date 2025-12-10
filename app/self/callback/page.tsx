"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function CallbackWorker() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let next = params.get("next");
        if (!next) {
          // Default to wallet page using preferred language (cookie or localStorage), fallback to 'en'
          const cookieLang = document.cookie
            .split("; ")
            .find((row) => row.startsWith("preferredLanguage="))
            ?.split("=")[1];
          const lsLang = localStorage.getItem("preferredLanguage") || undefined;
          const lang = cookieLang || lsLang || "en";
          next = `/${lang}/`;
        }
        // Redirect the user back to the app
        // Profile will be refetched automatically when the page regains focus
        router.replace(next);
      } catch {
        // If anything fails, go home to avoid trapping the user
        router.replace("/");
      }
    };

    handleCallback();
  }, [params, router]);

  return null;
}

export default function SelfCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackWorker />
    </Suspense>
  );
}
