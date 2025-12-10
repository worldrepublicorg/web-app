"use client";

import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiList } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { PoliticalPartyList } from "@/components/parties/political-party-list";
import { TopBar } from "@/components/topbar";
import type { Party } from "@/lib/types/parties";

interface PartiesPageClientProps {
  parties: Party[];
  dictionary: Dictionary;
  lang: string;
}

export default function PartiesPageClient({
  parties,
  dictionary,
  lang,
}: PartiesPageClientProps) {
  const pathname = usePathname();
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.sections.parties.title}
        endAdornment={
          <Link
            href={`/${lang}/menu`}
            onClick={() => {
              // Store the current page as the return URL
              localStorage.setItem("menuReturnUrl", pathname);
            }}
          >
            <Button variant="tertiary" size="icon" className="bg-gray-100">
              <PiList className="size-4 text-gray-900" />
            </Button>
          </Link>
        }
      />

      <main className="flex grow flex-col items-start">
        <PoliticalPartyList
          initialParties={parties}
          dictionary={dictionary}
          lang={lang}
        />
      </main>
    </div>
  );
}
