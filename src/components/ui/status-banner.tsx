export type StatusBannerVariant = "success" | "warning" | "error" | "info";

interface StatusBannerProps {
  variant: StatusBannerVariant;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const VARIANT_CLASSES: Record<StatusBannerVariant, string> = {
  success: "border-[#00e676] bg-[#00e676]/10 text-[#00e676]",
  warning: "border-[#ffb300] bg-[#ffb300]/10 text-[#ffb300]",
  error: "border-[#ff2a2a] bg-[#ff2a2a]/10 text-[#ff6b6b]",
  info: "border-[#3a3834] bg-[#111111] text-[#f2efe9]",
};

export function StatusBanner({ variant, message, actionLabel, onAction }: StatusBannerProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`p-2.5 border font-mono text-[10px] sm:text-[11px] flex items-center justify-between gap-2 ${VARIANT_CLASSES[variant]}`}
    >
      <span className="leading-relaxed break-words min-w-0">{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-2 py-1 border border-current uppercase font-bold shrink-0 cursor-pointer hover:opacity-85"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
