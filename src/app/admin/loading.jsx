import GenZLoader from "@/components/ui/GenZLoader";

export default function AdminLoading() {
  return <GenZLoader fullScreen={false} text="Authenticating super admin portal..." />;
}
