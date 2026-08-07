import { useEffect } from "react";
import { getSiteUrl } from "@/lib/siteUrl";

interface SeoProps {
  title: string;
  description?: string;
  /** Path or absolute URL for the canonical/OG url. Defaults to current path. */
  path?: string;
  image?: string;
  /** og:type  -  "website" (default) or "profile" for expert pages. */
  type?: "website" | "profile" | "article";
  /**
   * Keep the page out of the index. Use for account/private routes and the 404,
   * which this SPA otherwise serves with a 200 status (a soft 404).
   */
  noindex?: boolean;
  /** schema.org entity for this page, injected as JSON-LD. */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  /** Trail for a BreadcrumbList, ordered root -> current. */
  breadcrumbs?: { name: string; path: string }[];
}

const DEFAULT_DESCRIPTION =
  "Connect instantly with verified professionals, mentors, and guides for any life, career, or travel situation. People for People.";
const DEFAULT_IMAGE = "/og-image.png";

/** Every tag this component manages, used to snapshot/restore on unmount. */
const METAS: ["name" | "property", string][] = [
  ["name", "description"],
  ["property", "og:title"],
  ["property", "og:description"],
  ["property", "og:type"],
  ["property", "og:url"],
  ["property", "og:image"],
  ["name", "twitter:card"],
  ["name", "twitter:title"],
  ["name", "twitter:description"],
  ["name", "twitter:image"],
];

function setMeta(attr: "name" | "property", key: string, content: string) {
  // index.html declares the twitter:* tags with `property`, while og:* uses
  // `property` too. Match either attribute so we update the existing tag instead
  // of appending a duplicate that crawlers may read instead.
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"], meta[name="${key}"], meta[property="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Marker so page-level JSON-LD can be swapped without touching index.html's. */
const LD_ID = "seo-structured-data";

function setStructuredData(payload: unknown) {
  document.getElementById(LD_ID)?.remove();
  if (!payload) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = LD_ID;
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
}

/**
 * Per-page SEO + social-share tags. The base index.html ships generic tags; this
 * overrides them per route so expert profiles and key pages are discoverable and
 * render proper cards when shared on social/messaging apps. No dependency needed  - 
 * it manages document.head directly.
 */
const Seo = ({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  structuredData,
  breadcrumbs,
}: SeoProps) => {
  const fullTitle = title.includes("irookee") ? title : `${title} | irookee`;
  const desc = description || DEFAULT_DESCRIPTION;
  // Serialised so the effect re-runs on content change, not object identity.
  const ldKey = structuredData ? JSON.stringify(structuredData) : "";
  const crumbKey = breadcrumbs ? JSON.stringify(breadcrumbs) : "";

  useEffect(() => {
    const base = getSiteUrl() || window.location.origin;
    const url = path
      ? path.startsWith("http")
        ? path
        : `${base}${path}`
      : window.location.href;
    const img = image
      ? image.startsWith("http")
        ? image
        : `${base}${image}`
      : `${base}${DEFAULT_IMAGE}`;

    // Snapshot what index.html (or a previous route) had, so leaving this page
    // does not leave its title/canonical/OG tags behind on routes that ship no
    // <Seo> of their own.
    const previous = {
      title: document.title,
      meta: METAS.map(([attr, key]) => {
        const el = document.head.querySelector<HTMLMetaElement>(
          `meta[name="${key}"], meta[property="${key}"]`
        );
        return { attr, key, content: el ? el.getAttribute("content") : null };
      }),
      canonical:
        document.head
          .querySelector<HTMLLinkElement>('link[rel="canonical"]')
          ?.getAttribute("href") ?? null,
      robots:
        document.head
          .querySelector<HTMLMetaElement>('meta[name="robots"]')
          ?.getAttribute("content") ?? null,
    };

    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", img);

    setCanonical(url);

    // Page-level JSON-LD. A noindex page gets none — there is nothing to
    // surface in results.
    if (!noindex) {
      const graph: Record<string, unknown>[] = [];
      if (structuredData) {
        graph.push(...(Array.isArray(structuredData) ? structuredData : [structuredData]));
      }
      if (breadcrumbs?.length) {
        graph.push({
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.name,
            item: crumb.path.startsWith("http") ? crumb.path : `${base}${crumb.path}`,
          })),
        });
      }
      if (graph.length) {
        setStructuredData({ "@context": "https://schema.org", "@graph": graph });
      }
    }

    return () => {
      document.title = previous.title;
      previous.meta.forEach(({ attr, key, content }) => {
        if (content !== null) setMeta(attr, key, content);
      });
      if (previous.robots !== null) setMeta("name", "robots", previous.robots);
      if (previous.canonical !== null) setCanonical(previous.canonical);
      else
        document.head
          .querySelector<HTMLLinkElement>('link[rel="canonical"]')
          ?.remove();
      setStructuredData(null);
    };
  }, [fullTitle, desc, path, image, type, noindex, ldKey, crumbKey, structuredData, breadcrumbs]);

  return null;
};

export default Seo;
