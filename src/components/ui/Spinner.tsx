import { LoaderCircle } from "lucide-react";

export function Spinner({ size = 16 }: { size?: number }) {
  return <LoaderCircle aria-hidden size={size} className="animate-spin motion-reduce:animate-none" />;
}
