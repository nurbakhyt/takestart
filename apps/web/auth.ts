import { D1Adapter } from "@auth/d1-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

/**
 * Auth.js v5. Конфиг ленивый (колбэк), т.к. Cloudflare-биндинги
 * доступны только в рантайме запроса, а не на сборке.
 * Секреты — через wrangler vars/secrets (см. .dev.vars.example).
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const { env } = getCloudflareContext();
  return {
    // За прокси Cloudflare (CF сам ставит заголовки, подделать их снаружи нельзя)
    trustHost: true,
    secret: env.AUTH_SECRET,
    adapter: D1Adapter(env.DB),
    providers: [
      // Google включается только когда секреты заданы — иначе пустые
      // credentials ломают весь auth-модуль (Configuration error).
      ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
        ? [
            Google({
              clientId: env.AUTH_GOOGLE_ID,
              clientSecret: env.AUTH_GOOGLE_SECRET,
              allowDangerousEmailAccountLinking: true,
            }),
          ]
        : []),
      Resend({
        apiKey: env.AUTH_RESEND_KEY,
        from: env.AUTH_RESEND_FROM ?? "TakeStart <login@takestart.cc>",
      }),
    ],
  };
});
