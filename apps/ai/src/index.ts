import { validateTranslateRequest } from "./contract";
import { TRANSLATE_MODEL } from "./model";
import { translate } from "./translate";

interface Env {
  AI: Ai;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

/**
 * Публичного входа у сервиса нет (`workers_dev = false`): единственный легальный
 * вызывающий — web-воркер по service binding, авторизация живёт на его роуте.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let pathname: string;
    try {
      pathname = new URL(request.url).pathname;
    } catch {
      return json({ error: "bad_request" }, 400);
    }

    if (pathname === "/") {
      return json({ service: "takestart-ai", translateModel: TRANSLATE_MODEL });
    }

    if (pathname !== "/translate") {
      return json({ error: "not_found" }, 404);
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "method_not_allowed" },
        { status: 405, headers: { allow: "POST" } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_request" }, 400);
    }

    const validated = validateTranslateRequest(body);
    if (!validated.ok) return json({ error: "bad_request" }, 400);

    try {
      const outcome = await translate(env.AI, validated.value);
      if (!outcome.ok) throw new Error(outcome.reason);
      return json({ translations: outcome.translations });
    } catch (error) {
      console.error("translate failed", error);
      return json({ error: "upstream" }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
