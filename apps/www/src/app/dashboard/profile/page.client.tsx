import { MainLayout } from "@/components/layout/MainLayout";
import { UserProfile } from "@/components/user-profile";

export default function Page() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <UserProfile />
      </div>
    </MainLayout>
  );
}
