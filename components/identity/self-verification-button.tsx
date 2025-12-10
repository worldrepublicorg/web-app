"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { useAuth } from "@/hooks/use-auth";
import { CustomListItem } from "../custom-list-item";
import { SelfVerificationDialog } from "./self-verification-dialog";

interface SelfVerificationButtonProps {
  userId: string | null;
  selfVerifiedAt: number | null;
  isLoading?: boolean;
  verifiedStatus: string;
  notVerifiedStatus: string;
  dictionary: Dictionary;
}

const SelfVerificationButton = ({
  userId,
  selfVerifiedAt,
  isLoading: propIsLoading = false,
  verifiedStatus,
  notVerifiedStatus,
  dictionary,
}: SelfVerificationButtonProps) => {
  const { user } = useAuth();
  const router = useRouter();

  const isVerified = Boolean(selfVerifiedAt);
  const isLoading = propIsLoading;

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && !isVerified && !isLoading && user?.id) {
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isVerified, isLoading, user?.id, router]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const statusText = isVerified ? verifiedStatus : notVerifiedStatus;

  // If verified, show non-clickable item
  if (isVerified) {
    return (
      <CustomListItem label="Self" description={statusText} noPointer={true} />
    );
  }

  return (
    <>
      <CustomListItem
        label="Self"
        description={statusText}
        noPointer={false}
        onClick={() => setDialogOpen(true)}
      />

      <SelfVerificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={async () => {
          // Refetch profile to get updated selfVerifiedAt from server
          router.refresh();
        }}
        userId={userId || user?.id || null}
        dictionary={dictionary}
      />
    </>
  );
};

export default SelfVerificationButton;
