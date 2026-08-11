import LanShareApp from "@/components/LanShareApp";
import { ToastHost } from "@/components/Toast";
import { ensurePin } from "@/lib/auth";
import { ensureUploadDir } from "@/lib/files";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Bootstrap PIN + upload folder on first request
  await ensureUploadDir();
  await ensurePin();

  return (
    <>
      <main className="relative">
        <LanShareApp />
      </main>
      <ToastHost />
    </>
  );
}
