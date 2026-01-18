import { useEffect, useState } from "react";

export function useAuthState() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setIsAuth(false);
          return;
        }

        const json = await res.json();
        const responseUser = json?.user ?? json;
        console.debug("[auth/me] response fields", {
          hasUser: Boolean(json?.user),
          userKeys:
            responseUser && typeof responseUser === "object"
              ? Object.keys(responseUser)
              : [],
        });
        setIsAuth(!!json?.user?.id);
      } catch {
        setIsAuth(false);
      }
    })();
  }, []);

  return isAuth; // null → loading
}
