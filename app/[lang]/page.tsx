import { getDictionary } from "@/app/[lang]/dictionaries";
import VotePageClient from "./page-client";

export default async function VotePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <VotePageClient dictionary={dictionary} />;
}
