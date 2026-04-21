import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  image?: string | null;
  name?: string | null;
  textClassName?: string;
}

function getInitials(name?: string | null) {
  if (!name) {
    return "DS";
  }

  const initials = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "DS";
}

export function UserAvatar({ className, image, name, textClassName }: UserAvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ? `${name} avatar` : "User avatar"}
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
      <span className={cn("text-xs tracking-[0.16em]", textClassName)}>{getInitials(name)}</span>
    </div>
  );
}
