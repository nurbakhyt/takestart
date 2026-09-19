import { describe, expect, it, vi } from "vitest";

import type { TranslateRequest } from "../src/contract";
import { TRANSLATE_MODEL } from "../src/model";
import { translate } from "../src/translate";

const request: TranslateRequest = {
  entity: "product",
  from: "ru",
  to: ["kk", "en"],
  texts: ["Сорпа"],
};

const rows = (value: string) => `{"translations": ${value}}`;

/** Ответ в формате OpenAI: так отвечает gpt-oss-120b. */
const answer = (text: string) => ({ choices: [{ message: { content: text } }] });

function fakeAi(replies: unknown[]) {
  const run = vi.fn(
    async (_model: string, _options: { messages: { content: string }[] }) =>
      replies.shift(),
  );
  return { ai: { run } as unknown as Ai, run };
}

describe("translate", () => {
  it("calls the model once per text and keeps the input order", async () => {
    const { ai, run } = fakeAi([
      answer(rows('[["Сорпа","Soup"]]')),
      answer(rows('[["Лағман","Lagman"]]')),
    ]);

    const outcome = await translate(ai, { ...request, texts: ["Сорпа", "Лағман"] });

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0][0]).toBe(TRANSLATE_MODEL);
    expect(outcome).toEqual({
      ok: true,
      translations: [
        ["Сорпа", "Soup"],
        ["Лағман", "Lagman"],
      ],
    });
  });

  it("sends exactly one name per call", async () => {
    const { ai, run } = fakeAi([
      answer(rows('[["Сорпа","Soup"]]')),
      answer(rows('[["Лағман","Lagman"]]')),
    ]);

    await translate(ai, { ...request, texts: ["Сорпа", "Лағман"] });

    const bodies = run.mock.calls.map((call) => call[1]);
    for (const [index, body] of bodies.entries()) {
      const user = body.messages[1].content;
      expect(user).toBe(
        JSON.stringify({
          names: [["Сорпа", "Лағман"][index]],
          from: "ru",
          to: ["kk", "en"],
        }),
      );
    }
  });

  it("retries once after an unusable answer", async () => {
    const { ai, run } = fakeAi([
      answer("I cannot help with that"),
      answer(rows('[["Сорпа","Soup"]]')),
    ]);

    const outcome = await translate(ai, request);

    expect(run).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({ ok: true, translations: [["Сорпа", "Soup"]] });
  });

  it("reports the parse reason when both attempts fail", async () => {
    const { ai, run } = fakeAi([
      answer("I cannot help with that"),
      answer("Still no JSON"),
    ]);

    const outcome = await translate(ai, request);

    expect(run).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({
      ok: false,
      reason: "model did not return a JSON object",
    });
  });

  it("gives up on the whole batch and returns no partial result", async () => {
    const { ai, run } = fakeAi([
      answer(rows('[["Сорпа","Soup"]]')),
      answer("no JSON"),
      answer("no JSON again"),
    ]);

    const outcome = await translate(ai, { ...request, texts: ["Сорпа", "Лағман"] });

    expect(run).toHaveBeenCalledTimes(3);
    expect(outcome).toEqual({
      ok: false,
      reason: "model did not return a JSON object",
    });
  });

  it("reads the answer from the reasoning field when content is empty", async () => {
    const { ai } = fakeAi([
      { choices: [{ message: { content: null, reasoning: rows('[["Сорпа","Sorpa"]]') } }] },
    ]);

    await expect(translate(ai, request)).resolves.toEqual({
      ok: true,
      translations: [["Сорпа", "Sorpa"]],
    });
  });

  it("reads the answer from the legacy response field", async () => {
    const { ai } = fakeAi([{ response: rows('[["Сорпа","Sorpa"]]') }]);

    await expect(translate(ai, request)).resolves.toEqual({
      ok: true,
      translations: [["Сорпа", "Sorpa"]],
    });
  });

  it("names the available fields when the model returns no text", async () => {
    const { ai } = fakeAi([{ usage: {}, metrics: {} }, { usage: {}, metrics: {} }]);

    await expect(translate(ai, request)).resolves.toEqual({
      ok: false,
      reason: "model returned no text (fields: usage, metrics)",
    });
  });
});
