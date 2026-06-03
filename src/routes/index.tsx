import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const { user } = useStore();
  const router = useRouter();
  useEffect(() => {
    router.navigate({ to: user ? "/app/dashboard" : "/login" });
  }, [user, router]);
  return null;
}
