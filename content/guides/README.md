# Guide content

One `.mdx` file per article, under `content/guides/<locale>/<slug>.mdx` — dropping in a new file is all it takes to publish it (ticket 37); no code change needed.

## Frontmatter

```yaml
---
title: 文章標題
description: 一句話摘要，會顯示在文章列表。
---
```

## Conventions

- **Headings**: `##`/`###` only (an `#` h1 is the page title, set from frontmatter). The table of contents is generated from these automatically.
- **Quotes and source citations**: both use Markdown blockquote syntax (`>`) — they share the same Iansui-accented styling (see ADR/ticket 37).
- **Images**: plain Markdown `![alt](url)` renders a bare `<img>`, no caption. For a captioned image, write the HTML directly (MDX allows it) —
  ```html
  <figure>
    <img src="/images/example.png" alt="替代文字" />
    <figcaption>圖說文字</figcaption>
  </figure>
  ```
