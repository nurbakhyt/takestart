import { describe, expect, it } from "vitest";

import type { TranslateRequest } from "../src/contract";
import { buildMessages } from "../src/prompt";

const request: TranslateRequest = {
  entity: "product",
  from: "ru",
  to: ["kk", "en"],
  texts: ["Лагман с говядиной"],
};

describe("buildMessages", () => {
  it("asks for the entity, the source and every target language by name", () => {
    const [system] = buildMessages(request);
    expect(system.role).toBe("system");
    expect(system.content).toContain("product");
    expect(system.content).toContain("Russian");
    expect(system.content).toContain("Kazakh");
    expect(system.content).toContain("English");
  });

  it("names a category when the entity is a category", () => {
    const [system] = buildMessages({ ...request, entity: "category" });
    expect(system.content).toContain("category");
  });

  it("demands exactly one value per target language", () => {
    const [system] = buildMessages(request);
    expect(system.content).toContain("exactly 2 values");
    expect(system.content).toContain(
      '{"translations": [[<Kazakh>, <English>]]}',
    );
  });

  it("demands one value when there is a single target language", () => {
    const [system] = buildMessages({ ...request, to: ["en"] });
    expect(system.content).toContain("exactly 1 values");
    expect(system.content).toContain('{"translations": [[<English>]]}');
  });

  it("orders the target languages the way the caller asked", () => {
    const [system] = buildMessages({ ...request, to: ["en", "kk"] });
    expect(system.content).toContain("<English>, <Kazakh>");
  });

  it("forbids repeating the source in the output", () => {
    const [system] = buildMessages(request);
    expect(system.content).toContain("Never repeat the source name");
  });

  it("mentions the source language only as the source", () => {
    const [system] = buildMessages({ ...request, from: "kk", to: ["en"] });
    expect(system.content).toContain("Kazakh");
    expect(system.content).toContain("English");
    expect(system.content).not.toContain("Russian");
  });

  it("passes the texts and the language pair as JSON", () => {
    const [, user] = buildMessages(request);
    expect(user.role).toBe("user");
    expect(JSON.parse(user.content)).toEqual({
      names: request.texts,
      from: "ru",
      to: ["kk", "en"],
    });
  });

  it("hardcodes no model", () => {
    const [system] = buildMessages({ ...request, from: "kk", to: ["ru"] });
    expect(system.content).not.toContain("@cf/");
  });

  it("demands JSON-only output and untranslated brands", () => {
    const [system] = buildMessages(request);
    expect(system.content).toContain("Answer with JSON only");
    expect(system.content).toContain("brand names");
  });
});
