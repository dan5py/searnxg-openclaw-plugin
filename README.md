# searnxg_search

OpenClaw plugin that exposes a `searxng_search` tool, letting the agent query your self-hosted [SearXNG](https://docs.searxng.org/) instance.

## Prerequisites

A running SearXNG instance with **JSON output enabled**.
In your SearXNG `settings.yml`:

```yaml
search:
  formats:
    - html
    - json
```

## Install

### From local path

```bash
openclaw plugins install /path/to/searnxg_search
```

Or add the path to your OpenClaw config:

```json5
{
  plugins: {
    load: { paths: ["/path/to/searnxg_search"] },
  },
}
```

Restart the gateway after installing.

### Verify

```bash
openclaw plugins list   # should show searnxg-search
```

## Configuration

Configure plugin settings in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "searnxg-search": {
        enabled: true,
        config: {
          baseUrl: "http://localhost:8080",
        },
      },
    },
  },
}
```

You can also use OpenClaw env substitution if you want to keep values in env:

```json5
{
  plugins: {
    entries: {
      "searnxg-search": {
        config: {
          baseUrl: "${SEARXNG_BASE_URL}",
        },
      },
    },
  },
}
```

## Tool: `searxng_search`

### Parameters

| Name         | Type   | Required | Default          | Description                                                    |
| ------------ | ------ | -------- | ---------------- | -------------------------------------------------------------- |
| `q`          | string | yes      | -                | Search query                                                   |
| `categories` | string | no       | `general`        | Comma-separated categories (`general`, `images`, `news`, ...)  |
| `engines`    | string | no       | instance default | Comma-separated engines (`google`, `duckduckgo`, `brave`, ...) |
| `language`   | string | no       | instance default | ISO 639-1 code (`en`, `de`, `fr`, ...)                         |
| `pageno`     | number | no       | `1`              | Page number                                                    |
| `time_range` | string | no       | none             | `day`, `month`, or `year`                                      |
| `safesearch` | number | no       | `0` (off)        | `0` off, `1` moderate, `2` strict                              |

### Example usage

In an OpenClaw conversation the agent can call:

```
searxng_search({ q: "rust async runtime comparison", categories: "general", language: "en" })
```

The tool returns formatted results with titles, URLs, and snippets.

## License

MIT
