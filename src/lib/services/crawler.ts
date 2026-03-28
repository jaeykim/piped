import * as cheerio from "cheerio";

export interface PageData {
  url: string;
  title: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  headings: string[];
  bodyText: string;
  images: { src: string; alt: string }[];
  colors: string[];
  logoUrl?: string;
}

export interface CrawlResult {
  url: string;
  html: string;
  title: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  headings: string[];
  bodyText: string;
  images: { src: string; alt: string }[];
  links: string[];
  colors: string[];
  logoUrl?: string;
  subPages: PageData[];
}

async function fetchPage(url: string): Promise<{ html: string; ok: boolean }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PipedBot/1.0; +https://piped.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { html: "", ok: false };
    return { html: await response.text(), ok: true };
  } catch {
    return { html: "", ok: false };
  }
}

function parsePage(html: string, pageUrl: string): PageData & { internalLinks: string[] } {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content") || "";
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const keywords = $('meta[name="keywords"]').attr("content");

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

  const images: { src: string; alt: string }[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    const alt = $(el).attr("alt") || "";
    if (src) {
      try {
        const absoluteSrc = src.startsWith("http")
          ? src
          : new URL(src, pageUrl).href;
        images.push({ src: absoluteSrc, alt });
      } catch {
        // skip invalid URLs
      }
    }
  });

  // Find internal links (same origin)
  const origin = new URL(pageUrl).origin;
  const internalLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const absolute = href.startsWith("http") ? href : new URL(href, pageUrl).href;
      if (absolute.startsWith(origin) && !absolute.includes("#") && !absolute.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|css|js)$/i)) {
        internalLinks.push(absolute.split("?")[0]); // strip query params
      }
    } catch {
      // skip invalid URLs
    }
  });

  // Extract logo/favicon
  const logoSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'meta[property="og:image"]',
  ];
  let logoUrl: string | undefined;
  for (const sel of logoSelectors) {
    const val = $(sel).attr("href") || $(sel).attr("content");
    if (val) {
      try {
        logoUrl = val.startsWith("http") ? val : new URL(val, pageUrl).href;
        break;
      } catch { /* skip */ }
    }
  }

  const colorRegex = /#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const styleText = $("style").text() + $("[style]").text();
  const colors = [...new Set(styleText.match(colorRegex) || [])].slice(0, 10);

  return {
    url: pageUrl,
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    keywords,
    headings,
    bodyText,
    images: images.slice(0, 10),
    colors,
    logoUrl,
    internalLinks: [...new Set(internalLinks)],
  };
}

const MAX_SUB_PAGES = 5;

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  // 1. Crawl the main page
  const mainPage = await fetchPage(normalizedUrl);
  if (!mainPage.ok) {
    throw new Error(`Failed to crawl ${normalizedUrl}`);
  }

  const mainData = parsePage(mainPage.html, normalizedUrl);

  // 2. Discover and crawl sub-pages (up to MAX_SUB_PAGES)
  const visitedUrls = new Set([normalizedUrl, normalizedUrl + "/"]);
  const subPageUrls = mainData.internalLinks
    .filter((link) => !visitedUrls.has(link) && !visitedUrls.has(link + "/"))
    .slice(0, MAX_SUB_PAGES);

  const subPages: PageData[] = [];
  if (subPageUrls.length > 0) {
    const results = await Promise.all(
      subPageUrls.map(async (subUrl) => {
        const page = await fetchPage(subUrl);
        if (!page.ok) return null;
        const { internalLinks: _, ...data } = parsePage(page.html, subUrl);
        return data;
      })
    );
    results.forEach((r) => {
      if (r) subPages.push(r);
    });
  }

  // 3. Merge all data
  const allHeadings = [
    ...mainData.headings,
    ...subPages.flatMap((p) => p.headings),
  ];
  const allImages = [
    ...mainData.images,
    ...subPages.flatMap((p) => p.images),
  ].slice(0, 20);
  const allColors = [
    ...new Set([...mainData.colors, ...subPages.flatMap((p) => p.colors)]),
  ].slice(0, 10);

  // Combine body text from all pages
  const allBodyText = [
    mainData.bodyText,
    ...subPages.map((p) => `[${p.title || p.url}] ${p.bodyText}`),
  ].join("\n\n").slice(0, 8000);

  return {
    url: normalizedUrl,
    html: mainPage.html,
    title: mainData.title,
    metaDescription: mainData.metaDescription,
    ogTitle: mainData.ogTitle,
    ogDescription: mainData.ogDescription,
    ogImage: mainData.ogImage,
    keywords: mainData.keywords,
    headings: allHeadings,
    bodyText: allBodyText,
    images: allImages,
    links: mainData.internalLinks.slice(0, 50),
    colors: allColors,
    logoUrl: mainData.logoUrl,
    subPages,
  };
}
