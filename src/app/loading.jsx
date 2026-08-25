import GenZLoader from "@/components/ui/GenZLoader";

/**
 * Root Next.js App Router Loading Suspense Page.
 * Renders the GenZ interactive avatar loading experience.
 */
export default function Loading() {
  return <GenZLoader fullScreen={true} />;
}
