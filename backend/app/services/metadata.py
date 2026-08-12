from dataclasses import dataclass
from typing import Protocol
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup, Tag

_USER_AGENT = "LinkPulseBot/0.1 (+https://github.com/FarrisKamel/LinkPulse)"


@dataclass
class PageMetadata:
    """Metadata scraped from a page. All fields optional — an unreachable or
    non-HTML URL yields an all-None instance."""

    title: str | None = None
    description: str | None = None
    og_image_url: str | None = None
    favicon_url: str | None = None


class MetadataFetcher(Protocol):
    """The seam (forward-risk F-1): the endpoint depends on this interface,
    not on httpx. Production injects HttpxMetadataFetcher; tests inject a fake
    so they never hit the network."""

    async def fetch(self, url: str) -> PageMetadata: ...


# --- pure parsing (no network — unit-testable in isolation) ----------------


def _meta_content(soup: BeautifulSoup, **attrs: str) -> str | None:
    tag = soup.find("meta", attrs=attrs)
    if isinstance(tag, Tag):
        content = tag.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()
    return None


def _extract_title(soup: BeautifulSoup) -> str | None:
    og_title = _meta_content(soup, property="og:title")
    if og_title:
        return og_title
    if soup.title and soup.title.string:
        return soup.title.string.strip()
    return None


def _is_empty_data_uri(href: str) -> bool:
    """True for degenerate data URIs like `data:,` that sites use to suppress
    the favicon. A real inlined favicon (data:image/png;base64,AAAA...) has a
    non-empty payload after the comma and is kept."""
    if not href.startswith("data:"):
        return False
    payload = href.split(",", 1)[1] if "," in href else ""
    return not payload.strip()


def _extract_favicon(soup: BeautifulSoup, base_url: str) -> str | None:
    for link in soup.find_all("link"):
        if not isinstance(link, Tag):
            continue
        rel = link.get("rel")
        rels = rel if isinstance(rel, list) else [rel] if rel else []
        if any(isinstance(r, str) and "icon" in r.lower() for r in rels):
            href = link.get("href")
            if isinstance(href, str) and href.strip() and not _is_empty_data_uri(
                href.strip()
            ):
                # Resolve relative hrefs (e.g. "/favicon.ico") against the page.
                return urljoin(base_url, href.strip())
    return None


def parse_metadata(html: str, base_url: str) -> PageMetadata:
    """Extract metadata from an HTML document. `base_url` is the page's final
    URL (after redirects), used to resolve relative image/favicon paths."""
    soup = BeautifulSoup(html, "html.parser")

    description = _meta_content(soup, name="description") or _meta_content(
        soup, property="og:description"
    )
    og_image = _meta_content(soup, property="og:image")

    return PageMetadata(
        title=_extract_title(soup),
        description=description,
        og_image_url=urljoin(base_url, og_image) if og_image else None,
        favicon_url=_extract_favicon(soup, base_url),
    )


# --- real fetcher (network) ------------------------------------------------


class HttpxMetadataFetcher:
    """Fetches a URL and parses its metadata. Any network/HTTP failure returns
    empty metadata rather than raising — the caller still saves the bookmark
    with just its URL (spec: 'handle unreachable URL gracefully')."""

    def __init__(self, timeout: float = 10.0) -> None:
        self._timeout = timeout

    async def fetch(self, url: str) -> PageMetadata:
        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=self._timeout,
                headers={"User-Agent": _USER_AGENT},
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
        except httpx.HTTPError:
            return PageMetadata()

        if "html" not in resp.headers.get("content-type", "").lower():
            return PageMetadata()

        return parse_metadata(resp.text, base_url=str(resp.url))


def get_metadata_fetcher() -> MetadataFetcher:
    """FastAPI dependency provider. Overridden in tests to inject a fake."""
    return HttpxMetadataFetcher()
