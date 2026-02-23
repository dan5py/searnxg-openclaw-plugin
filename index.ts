import { Type } from "@sinclair/typebox";

interface SearxngResult {
  title?: string;
  url?: string;
  content?: string;
  engine?: string;
  category?: string;
}

interface SearxngResponse {
  query?: string;
  number_of_results?: number;
  results?: SearxngResult[];
}

interface PluginConfig {
  baseUrl?: string;
}

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { config?: PluginConfig }>;
  };
}

const DEFAULT_PARAMS = {
  categories: "general",
  pageno: 1,
  safesearch: 0,
};

const PLUGIN_ID = "searnxg-search";
const DEFAULT_BASE_URL = "http://localhost:8080";

function resolveBaseUrl(config: OpenClawConfig | undefined): string {
  const configuredUrl = config?.plugins?.entries?.[PLUGIN_ID]?.config?.baseUrl;
  if (typeof configuredUrl === "string" && configuredUrl.trim().length > 0) {
    return configuredUrl.trim();
  }
  return DEFAULT_BASE_URL;
}

function formatResults(data: SearxngResponse): string {
  const results = data.results ?? [];
  if (results.length === 0) {
    return `No results found for "${data.query ?? "unknown"}".`;
  }

  const lines: string[] = [
    `Found ${results.length} results for "${data.query ?? "unknown"}":`,
    "",
  ];

  for (const r of results) {
    if (r.title) lines.push(`**${r.title}**`);
    if (r.url) lines.push(r.url);
    if (r.content) lines.push(r.content);
    lines.push("");
  }

  return lines.join("\n");
}

function toolText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export default function (api: {
  config?: OpenClawConfig;
  registerTool: (tool: {
    name: string;
    description: string;
    parameters: ReturnType<typeof Type.Object>;
    execute: (
      id: string,
      params: Record<string, unknown>,
    ) => Promise<{ content: { type: "text"; text: string }[] }>;
  }) => void;
}) {
  api.registerTool({
    name: "searxng_search",
    description:
      "Search the web via a local SearXNG instance. Returns titles, URLs, and snippets.",
    parameters: Type.Object({
      q: Type.String({ description: "Search query" }),
      categories: Type.Optional(
        Type.String({
          description:
            "Comma-separated search categories (e.g. general, images, news)",
          default: DEFAULT_PARAMS.categories,
        }),
      ),
      engines: Type.Optional(
        Type.String({
          description:
            "Comma-separated engine names (e.g. google, duckduckgo, brave)",
        }),
      ),
      language: Type.Optional(
        Type.String({
          description: "ISO 639-1 language code (e.g. en, de, fr)",
        }),
      ),
      pageno: Type.Optional(
        Type.Number({
          description: "Page number",
          default: DEFAULT_PARAMS.pageno,
          minimum: 1,
        }),
      ),
      time_range: Type.Optional(
        Type.Union(
          [Type.Literal("day"), Type.Literal("month"), Type.Literal("year")],
          { description: "Limit results to day, month, or year" },
        ),
      ),
      safesearch: Type.Optional(
        Type.Union([Type.Literal(0), Type.Literal(1), Type.Literal(2)], {
          description: "Safe-search level: 0 = off, 1 = moderate, 2 = strict",
          default: DEFAULT_PARAMS.safesearch,
        }),
      ),
    }),

    async execute(_id, params) {
      const baseUrl = resolveBaseUrl(api.config).replace(/\/+$/, "");

      const url = new URL(`${baseUrl}/search`);
      url.searchParams.set("format", "json");
      url.searchParams.set("q", params["q"] as string);

      const optional: Record<string, string | undefined> = {
        categories:
          (params["categories"] as string | undefined) ??
          DEFAULT_PARAMS.categories,
        engines: params["engines"] as string | undefined,
        language: params["language"] as string | undefined,
        pageno: String(
          (params["pageno"] as number | undefined) ?? DEFAULT_PARAMS.pageno,
        ),
        time_range: params["time_range"] as string | undefined,
        safesearch: String(
          (params["safesearch"] as number | undefined) ??
            DEFAULT_PARAMS.safesearch,
        ),
      };

      for (const [key, value] of Object.entries(optional)) {
        if (value != null) url.searchParams.set(key, value);
      }

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          signal: AbortSignal.timeout(15_000),
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown network error";
        return toolText(
          `SearXNG request failed: ${msg}\n\nCheck plugins.entries.${PLUGIN_ID}.config.baseUrl (current: ${baseUrl}) and ensure your SearXNG instance is running.`,
        );
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return toolText(
          `SearXNG returned HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}.\n\nIf status is 403, ensure the instance has format=json enabled in settings.yml under search.formats.`,
        );
      }

      let data: SearxngResponse;
      try {
        data = (await response.json()) as SearxngResponse;
      } catch {
        return toolText(
          "SearXNG returned a non-JSON response. Ensure the instance supports format=json (check settings.yml search.formats).",
        );
      }

      return toolText(formatResults(data));
    },
  });
}
