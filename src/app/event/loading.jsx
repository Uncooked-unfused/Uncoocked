import GenZLoader from "@/components/ui/GenZLoader";

export default function EventLoading() {
  return <GenZLoader fullScreen={false} text="Syncing campus event matrix..." />;
}
