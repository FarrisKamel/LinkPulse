import asyncio
import ipaddress
import socket
from dataclasses import dataclass
from typing import Protocol
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup, Tag

from app.config import settings

_USER_AGENT = "LinkPulseBot/0.1 (+https://github.com/FarrisKamel/LinkPulse)"
_MAX_REDIRECTS = 5


async def _host_is_safe(host: str) -> bool:
    """SSRF guard: reject hosts that resolve to a private, loopback,
    link-local, reserved, multicast, or unspecified address. Without this the
    scraper could be pointed at internal services (e.g. the cloud metadata
    endpoint at 169.254.169.254). Runs the blocking DNS lookup off the loop."""

    def _check() -> bool:
        try:
            infos = socket.getaddrinfo(host, None)
        except socket.gaierror:
            return False
        for info in infos:
            ip = ipaddress.ip_address(info[4][0])
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
                or ip.is_unspecified
            ):
                return False
        return True

    return await asyncio.to_thread(_check)


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
        # Follow redirects manually so every hop's host is SSRF-checked before
        # a request is made (a public URL could otherwise redirect internally).
        try:
            async with httpx.AsyncClient(
                follow_redirects=False,
                timeout=self._timeout,
                headers={"User-Agent": _USER_AGENT},
            ) as client:
                current = url
                for _ in range(_MAX_REDIRECTS + 1):
                    host = urlparse(current).hostname
                    if not host or not await _host_is_safe(host):
                        return PageMetadata()
                    resp = await client.get(current)
                    if resp.is_redirect:
                        location = resp.headers.get("location")
                        if not location:
                            return PageMetadata()  # malformed redirect
                        current = str(httpx.URL(current).join(location))
                        continue
                    resp.raise_for_status()
                    break
                else:
                    return PageMetadata()  # too many redirects
        except httpx.HTTPError:
            return PageMetadata()

        if "html" not in resp.headers.get("content-type", "").lower():
            return PageMetadata()

        return parse_metadata(resp.text, base_url=str(resp.url))


class StubMetadataFetcher:
    """Deterministic, offline fetcher for the E2E stack — derives metadata from
    the URL so tests don't depend on live websites (forward-risk F-1)."""

    async def fetch(self, url: str) -> PageMetadata:
        host = urlparse(url).hostname or url
        return PageMetadata(title=f"Site: {host}", description=f"Preview for {host}")


def get_metadata_fetcher() -> MetadataFetcher:
    """FastAPI dependency provider. Overridden in unit tests to inject a fake;
    the E2E stack sets FAKE_METADATA=1 to use the offline stub."""
    if settings.fake_metadata:
        return StubMetadataFetcher()
    return HttpxMetadataFetcher()
