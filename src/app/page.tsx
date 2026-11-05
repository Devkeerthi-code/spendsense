import { Features, Steps } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Privacy, SiteFooter } from "@/components/landing/Privacy";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { currentUser } from "@/server/auth";

export default async function LandingPage() {
  const user = await currentUser();
  const signedIn = Boolean(user);
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <Features />
        <Steps />
        <Privacy />
      </main>
      <SiteFooter />
    </>
  );
}
