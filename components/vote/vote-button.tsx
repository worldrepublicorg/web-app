"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  Skeleton,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PiInfoFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { useAuth } from "@/hooks/use-auth";
import { getUserProfile } from "@/lib/actions/member";

// Lazy load heavy dialog components - they're only needed when user interacts
const SignInDialog = dynamic(
  () =>
    import("@/components/auth/sign-in-dialog").then((mod) => mod.SignInDialog),
  { ssr: false },
);

const SelfVerificationDialog = dynamic(
  () =>
    import("@/components/identity/self-verification-dialog").then(
      (mod) => mod.SelfVerificationDialog,
    ),
  { ssr: false },
);

interface VoteButtonProps {
  fullWidth?: boolean;
  className?: string;
  label?: string; // Optional pre-translated label from server
  dictionary: Dictionary;
}

export function VoteButton({
  fullWidth = false,
  className,
  label,
  dictionary,
}: VoteButtonProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Use provided label or fall back to dictionary
  const buttonLabel = label || dictionary.common.vote;

  const [selfVerifiedAt, setSelfVerifiedAt] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [preVerificationDialogOpen, setPreVerificationDialogOpen] =
    useState(false);
  const [selfVerificationDialogOpen, setSelfVerificationDialogOpen] =
    useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  // Fetch user profile for verification status
  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
      if (isAuthenticated && !authLoading) {
        setProfileLoading(true);
        try {
          const profileResult = await getUserProfile();
          if (isMounted && profileResult.success && profileResult.profile) {
            setSelfVerifiedAt(profileResult.profile.selfVerifiedAt || null);
          }
        } catch (error) {
          console.error("[VoteButton] Error fetching user profile:", error);
        } finally {
          if (isMounted) {
            setProfileLoading(false);
          }
        }
      } else if (!isAuthenticated && !authLoading) {
        if (isMounted) {
          setSelfVerifiedAt(null);
          setProfileLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authLoading]);

  const handlePreVerifyClick = () => {
    setPreVerificationDialogOpen(false);
    setSelfVerificationDialogOpen(true);
  };

  const handleVoteClick = () => {
    if (!isAuthenticated && !authLoading) {
      setSignInDialogOpen(true);
    } else {
      setPreVerificationDialogOpen(true);
    }
  };

  const handleVerificationSuccess = async () => {
    router.refresh();
    // Refresh user profile after verification
    const profileResult = await getUserProfile();
    if (profileResult.success && profileResult.profile) {
      setSelfVerifiedAt(profileResult.profile.selfVerifiedAt || null);
    }
  };

  const isVerified = Boolean(selfVerifiedAt);

  return (
    <>
      <Button
        fullWidth={fullWidth}
        className={className}
        onClick={handleVoteClick}
      >
        {buttonLabel}
      </Button>

      {/* Pre-verification or coming soon dialog */}
      <AlertDialog
        open={preVerificationDialogOpen}
        onOpenChange={setPreVerificationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <PiInfoFill className="h-[30px] w-[30px] text-gray-400" />
              </div>
            }
          >
            <Typography variant="heading" level={3}>
              {dictionary.pages.govern.vote.no_active_election}
            </Typography>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <Typography>
              {profileLoading
                ? null
                : isVerified
                  ? dictionary.pages.govern.vote.coming_soon.description
                  : dictionary.pages.govern.vote.pre_verification.description}
            </Typography>
            {profileLoading ? (
              <div>
                <Skeleton height={22} width="100%" />
                <Skeleton height={22} width="80%" />
              </div>
            ) : null}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button
              disabled={profileLoading}
              onClick={
                isVerified
                  ? () => setPreVerificationDialogOpen(false)
                  : handlePreVerifyClick
              }
              className="w-full"
            >
              {isVerified
                ? dictionary.common.close
                : dictionary.pages.govern.vote.pre_verification.verify_button}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Self verification dialog */}
      <SelfVerificationDialog
        open={selfVerificationDialogOpen}
        onOpenChange={setSelfVerificationDialogOpen}
        onSuccess={handleVerificationSuccess}
        userId={user?.id || null}
        dictionary={dictionary}
      />

      {/* Sign-in dialog */}
      <SignInDialog
        open={signInDialogOpen}
        onOpenChange={setSignInDialogOpen}
        dictionary={dictionary}
      />
    </>
  );
}
