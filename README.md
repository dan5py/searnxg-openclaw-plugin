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

### Environment variables

| Variable           | Default                 | Description                       |
| ------------------ | ----------------------- | --------------------------------- |
| `SEARXNG_BASE_URL` | `http://localhost:8080` | Base URL of your SearXNG instance |

Set it in your shell profile or OpenClaw environment config.

## Tool: `searxng_search`

### Parameters

| Name         | Type   | Required | Description                                                    |
| ------------ | ------ | -------- | -------------------------------------------------------------- |
| `q`          | string | yes      | Search query                                                   |
| `categories` | string | no       | Comma-separated categories (`general`, `images`, `news`, ...)  |
| `engines`    | string | no       | Comma-separated engines (`google`, `duckduckgo`, `brave`, ...) |
| `language`   | string | no       | ISO 639-1 code (`en`, `de`, `fr`, ...)                         |
| `pageno`     | number | no       | Page number (default 1)                                        |
| `time_range` | string | no       | `day`, `month`, or `year`                                      |
| `safesearch` | number | no       | `0` off, `1` moderate, `2` strict                              |

### Example usage

In an OpenClaw conversation the agent can call:

```
searxng_search({ q: "rust async runtime comparison", categories: "general", language: "en" })
```

The tool returns formatted results with titles, URLs, and snippets.

## License

MIT
