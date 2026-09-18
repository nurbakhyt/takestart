interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const inputs = {
      text: 'I like you. I love you',
    };

    const response = await env.AI.run(
      '@cf/huggingface/distilbert-sst-2-int8',
      inputs,
    );

    return Response.json({ inputs, response });
  },
} satisfies ExportedHandler<Env>;
