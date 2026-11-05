import { Brand } from "@/components/ui/Brand";
import { LinkButton } from "@/components/ui/Button";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
      <Brand />
      <nav aria-label="Account" className="flex items-center gap-2">
        {signedIn ? (
          <LinkButton href="/dashboard" size="sm">
            Open dashboard
          </LinkButton>
        ) : (
          <>
            <LinkButton href="/login" variant="ghost" size="sm">
              Sign in
            </LinkButton>
            <LinkButton href="/signup" size="sm">
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Create account</span>
            </LinkButton>
          </>
        )}
      </nav>
    </header>
  );
}
