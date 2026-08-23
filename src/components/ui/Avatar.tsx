import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({
  name = "User",
  color = "#6366f1",
  size = "md",
  className = "",
}: AvatarProps) {
  const initials = getInitials(name || "User");

  const sizeClasses = {
    sm: "avatar-sm",
    md: "avatar-md",
    lg: "avatar-lg",
  }[size];

  return (
    <div
      className={`avatar-badge ${sizeClasses} ${className}`}
      style={{ backgroundColor: color || "#6366f1" }}
      title={name || "User"}
    >
      <span>{initials}</span>

      <style jsx>{`
        .avatar-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
          user-select: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }

        .avatar-sm {
          width: 26px;
          height: 26px;
          font-size: 0.7rem;
        }

        .avatar-md {
          width: 36px;
          height: 36px;
          font-size: 0.85rem;
        }

        .avatar-lg {
          width: 48px;
          height: 48px;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}
