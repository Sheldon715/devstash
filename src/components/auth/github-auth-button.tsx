"use client";

import { signInWithGitHubAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 fill-current"
    >
      <path d="M12 .5C5.65.5.5 5.8.5 12.34c0 5.24 3.3 9.69 7.87 11.26.58.11.79-.26.79-.58v-2.04c-3.2.72-3.88-1.58-3.88-1.58-.52-1.38-1.28-1.74-1.28-1.74-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.23 1.77 1.23 1.03 1.82 2.7 1.29 3.36.98.11-.77.4-1.29.72-1.59-2.55-.3-5.23-1.32-5.23-5.89 0-1.3.45-2.36 1.19-3.19-.12-.31-.52-1.55.11-3.22 0 0 .97-.32 3.17 1.22a10.7 10.7 0 0 1 5.78 0c2.2-1.54 3.17-1.22 3.17-1.22.63 1.67.23 2.91.11 3.22.74.83 1.19 1.89 1.19 3.19 0 4.58-2.68 5.59-5.24 5.88.41.37.78 1.09.78 2.2v3.26c0 .32.21.7.8.58 4.56-1.57 7.86-6.02 7.86-11.26C23.5 5.8 18.35.5 12 .5Z" />
    </svg>
  );
}

interface GitHubAuthButtonProps {
  callbackUrl?: string;
  label: string;
}

export function GitHubAuthButton({
  callbackUrl = "/dashboard",
  label,
}: GitHubAuthButtonProps) {
  return (
    <form action={signInWithGitHubAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button
        type="submit"
        variant="outline"
        className="h-12 w-full rounded-lg border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.08]"
      >
        <GitHubMark />
        {label}
      </Button>
    </form>
  );
}
