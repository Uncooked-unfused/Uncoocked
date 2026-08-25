import GenZLoader from "@/components/ui/GenZLoader";

export default function DashboardLoading() {
  return <GenZLoader fullScreen={false} text="Syncing your dashboard metrics..." />;
}
