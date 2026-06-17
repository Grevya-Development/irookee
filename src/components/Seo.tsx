import { useEffect } from "react";
import { getSiteUrl } from "@/lib/siteUrl";

interface SeoProps {
  title: string;
  description?: string;
  /** Path or absolute URL for the canonical/OG url. Defaults to current path. */
  path?: string;
  image?: string;
  /** og:type — "website" (default) or "profile" for expert pages. */
  type?: "website" | "profile" | "article";
}

const DEFAULT_DESCRIPTION =
  "Connect instantly with verified professionals, mentors, and guides for any life, career, or travel situation. People for People.";
const DEFAULT_IMAGE = "/og-image.png";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
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

/**
 * Per-page SEO + social-share tags. The base index.html ships generic tags; this
 * overrides them per route so expert profiles and key pages are discoverable and
 * render proper cards when shared on social/messaging apps. No dependency needed —
 * it manages document.head directly.
 */
const Seo = ({ title, description, path, image, type = "website" }: SeoProps) => {
  const fullTitle = title.includes("irookee") ? title : `${title} | irookee`;
  const desc = description || DEFAULT_DESCRIPTION;

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

    document.title = fullTitle;
    setMeta("name", "description", desc);

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
  }, [fullTitle, desc, path, image, type]);

  return null;
};

export default Seo;
