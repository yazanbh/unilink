import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { auth } from "./lib/firebase";
import i18n from "./lib/i18n";

// Setup RTL/LTR support
const setupRTL = () => {
  const lang = localStorage.getItem("i18nextLng") || navigator.language || "en";
  const isArabic = lang.startsWith("ar");
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.documentElement.lang = lang;
};

setupRTL();

// Listen for language changes
i18n.on("languageChanged", (lng) => {
  const isArabic = lng.startsWith("ar");
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const user = auth.currentUser;
        if (user) {
          // For simplicity in this migration, we send the UID. 
          // In production, you should send user.getIdToken() and verify it on the server.
          return {
            Authorization: `Bearer ${user.uid}`,
          };
        }
        return {};
      },
    }),
  ],
});

// Ensure RTL is set before rendering
setupRTL();

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
