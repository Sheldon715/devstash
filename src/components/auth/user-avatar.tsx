import Image from "next/image";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  fallbackLabel?: string | null;
  image?: string | null;
  name?: string | null;
  textClassName?: string;
}

function getInitials(name?: string | null, fallbackLabel?: string | null) {
  const label = name?.trim() || fallbackLabel?.trim();

  if (!label) {
    return "DS";
  }

  const initials = label
    .replace(/@.*/, "")
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "DS";
}

export function UserAvatar({
  className,
  fallbackLabel,
  image,
  name,
  textClassName,
}: UserAvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ? `${name} avatar` : "User avatar"}
        width={40}
        height={40}
        sizes="40px"
        className={cn("size-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-[#dedede] font-semibold text-black",
        className,
      )}
    >
      <span className={cn("text-xs tracking-[0.16em]", textClassName)}>
        {getInitials(name, fallbackLabel)}
      </span>
    </div>
  );
}
