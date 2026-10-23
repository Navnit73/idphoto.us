# Deployment

idphoto.us is a standard Next.js 16 app. It runs on Node.js 20.9 or later (Node 24 LTS recommended) on any host that runs `next start`: Vercel, a container, or a VM. Content pages are prerendered at build time. Only `/api/*` runs per request.

## 1. Environment variables

Copy `.env.example` and set these values in your host's settings. Never commit real values.

| Variable               | Required                     | Notes                                                                                     |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Yes                          | Canonical origin, e.g. `https://idphoto.us`. Used for canonicals, sitemap, OG, and JSON-LD. |
| `NEXT_PUBLIC_SITE_ENV` | Yes, `production` on live    | **Anything other than `production` makes the whole site noindex** and robots.txt disallows everything. Use `preview` for staging. |
| `MONGODB_URI`          | For forms and photo editor   | `mongodb+srv://…`. Without it the site works, and the form and photo endpoints return 503. |
| `MONGODB_DB`           | No (default `idphoto`)       |                                                                                           |
| `IP_HASH_SALT`         | Yes, if `MONGODB_URI` is set | 16+ random characters (`openssl rand -hex 32`). Changing it resets rate limits.           |
| `CONTACT_WEBHOOK_URL`  | No                           | Slack-compatible webhook, pinged on new messages (no message body or email is sent).      |
| `PASSPORT_API_URL`     | No (default `https://api.pixpassport.com`) | PixPassport base URL for the photo editor.                                 |
| `PASSPORT_API_KEY`     | For the photo editor         | Sent as `X-API-Key`. Without it, `/api/photo/process` returns 503.                        |
| `SMTP_HOST`            | For email                    | e.g. `smtp.gmail.com`. Without it, "Email me this photo" returns 503 and contact emails are skipped. |
| `SMTP_PORT`            | No (default `587`)           |                                                                                           |
| `SMTP_SECURE`          | No (default `false`)         | `true` for port 465 (implicit TLS), `false` for 587 (STARTTLS, required).                 |
| `SMTP_USER` / `SMTP_PASS` | Usually                   | For Gmail, use an [app password](https://support.google.com/accounts/answer/185833), not the account password. |
| `MAIL_FROM`            | No (default `SMTP_USER`)     | Sender, e.g. `idphoto.us <hello@idphoto.us>`. Gmail only sends as the account or its aliases. |
| `MAIL_TO`              | No                           | Inbox that receives a copy of each contact message (Reply-To is the sender).              |
| `LOG_LEVEL`            | No (default `info`)          | `debug`, `info`, `warn`, or `error`.                                                      |

`NEXT_PUBLIC_*` values are baked in at build time, so rebuild after changing them. Server variables are validated when the app starts; invalid values fail fast with a clear message.

## 2. MongoDB

1. Create a cluster (MongoDB Atlas or self-hosted, MongoDB 6+).
2. Create a database user with `readWrite` on the app database only.
3. Restrict network access to your host's egress IPs where possible.
4. Set `MONGODB_URI`. Indexes, including the TTL index that expires rate-limit records, are created automatically on first connection.

Collections: `contact_messages`, `feedback`, `photo_results` (expire after 7 days via a TTL index), `rate_limits`. Read messages with Atlas or `mongosh`; there's no admin UI.

## 3. Build and run

```bash
npm ci
npm run lint        # ESLint + design-token check
npm run typecheck
npm run build       # also validates all Markdown content; fails on any content error
npm run start       # serves on PORT (default 3000)
```

On **Vercel**, import the repo, set the environment variables (use `NEXT_PUBLIC_SITE_ENV=preview` for the Preview environment and `production` for Production), and deploy. No other configuration is needed.

On **Docker or a VM**, run `npm ci && npm run build && npm run start` behind a TLS-terminating reverse proxy. Markdown in `content/` is included in traced output (`outputFileTracingIncludes` in `next.config.ts`).

### Health check

`GET /api/health` returns `200 {"status":"ok","database":"up" | "not_configured"}`, or `503` if a configured database can't be reached.

## 4. Domain and SEO launch checklist

- [ ] Serve only `https://idphoto.us`. Redirect `www.` and `http://` to it with a 301/308 at the host or DNS level.
- [ ] `NEXT_PUBLIC_SITE_URL=https://idphoto.us` and `NEXT_PUBLIC_SITE_ENV=production` are set on production only.
- [ ] Visit `/robots.txt` and `/sitemap.xml` on production and confirm they list the right URLs.
- [ ] Verify the domain in Google Search Console and Bing Webmaster Tools, and submit `https://idphoto.us/sitemap.xml`.
- [ ] Spot-check pages in Google's Rich Results Test (`Article`, `FAQPage`, `BreadcrumbList`).
- [ ] Replace `contactEmail` in `src/config/site.ts` with a mailbox that exists.
- [ ] Complete the `OWNER REVIEW` notes in `content/about/about.md` and `content/legal/*.md`, and have the legal pages reviewed by a lawyer.

## 5. Security

- **Headers:** `next.config.ts` sends CSP, HSTS (with preload), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and COOP on every response.
- **CSP tradeoff:** pages are statically prerendered, and a nonce-based CSP would force every page to render per request. The policy therefore allows `'unsafe-inline'` scripts (needed for Next's inline bootstrap) and locks everything else to `'self'`. Markdown can't inject scripts, because raw HTML is stripped. If you add third-party scripts (analytics, ads), add their origins to the CSP.
- **API endpoints:** same-origin `Origin` check, JSON bodies (or multipart uploads via `formHandler`) with size caps, Zod validation, MongoDB-backed rate limits keyed by salted IP hashes, a honeypot field, and generic error messages. Stack traces are never returned.
- **Client IP:** rate limiting reads the first `X-Forwarded-For` entry. Make sure your proxy or CDN overwrites that header rather than appending to client-supplied values (Vercel does this).
- **Secrets:** only `NEXT_PUBLIC_*` values reach the browser. Server modules import `server-only`, so importing them into client code fails the build.
- **Photos:** the photo editor (home page and `/tool/passport-photo-editor`) uploads: `/api/photo/process` accepts a JPEG/PNG/WebP up to 8 MB (the browser re-encodes and downsizes first), forwards it to PixPassport, and stores only the result links and metrics. Result pages (`/preview/<id>`) are `noindex`, keyed by an unguessable UUID, and expire after 7 days; the images themselves stay in PixPassport's Cloudinary storage. Cloudinary (`res.cloudinary.com`) is allowed in the CSP `img-src`.
- **Email:** all mail goes through `src/lib/mail` (`sendMail` + templates in `templates.ts`). Templates escape user input and include a plain-text part. Addresses and message content are never logged.

## 6. Logging and monitoring

- Server logs are JSON lines in production (`level`, `time`, `msg`, `route`, `requestId`, …), ready for any log drain (Vercel, Datadog, Logtail, CloudWatch). Keys that look sensitive, such as email, message, token, and URI, are redacted.
- `src/instrumentation.ts` logs every unhandled server error with its route and digest. The digest is the reference shown to users on the error page.
- Point an uptime monitor at `/api/health`.

## 7. Updating content

Edit or add Markdown in `content/`, commit, and redeploy. The build validates everything (see [CONTENT.md](CONTENT.md)) and regenerates pages, the sitemap, and social images. In development, Markdown edits appear on refresh without restarting.

## 8. Caching

- Content pages, hubs, `/sitemap.xml`, `/robots.txt`, and OG images (`/og/*`) are static and served with long `s-maxage`. A deploy replaces them.
- `/api/*` responses are `Cache-Control: no-store`.
- Content loading uses `"use cache"` with `cacheLife("max")`. Content only changes with a deploy, so no revalidation is needed.
