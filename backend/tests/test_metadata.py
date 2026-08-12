from app.services.metadata import parse_metadata

SAMPLE_HTML = """
<html>
  <head>
    <title>Fallback Title</title>
    <meta property="og:title" content="OG Title" />
    <meta name="description" content="A description." />
    <meta property="og:image" content="/images/cover.png" />
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body><h1>Hi</h1></body>
</html>
"""


def test_prefers_og_title_and_resolves_relative_urls() -> None:
    meta = parse_metadata(SAMPLE_HTML, base_url="https://example.com/page")
    assert meta.title == "OG Title"  # og:title wins over <title>
    assert meta.description == "A description."
    assert meta.og_image_url == "https://example.com/images/cover.png"
    assert meta.favicon_url == "https://example.com/favicon.ico"


def test_falls_back_to_title_tag_and_og_description() -> None:
    html = (
        "<html><head><title>Only Title</title>"
        '<meta property="og:description" content="OG desc"></head></html>'
    )
    meta = parse_metadata(html, base_url="https://x.test/")
    assert meta.title == "Only Title"  # no og:title -> use <title>
    assert meta.description == "OG desc"  # no name=description -> og:description
    assert meta.og_image_url is None
    assert meta.favicon_url is None


def test_empty_document_yields_all_none() -> None:
    meta = parse_metadata("<html></html>", base_url="https://x.test/")
    assert meta.title is None
    assert meta.description is None
    assert meta.og_image_url is None
    assert meta.favicon_url is None


def test_empty_data_uri_favicon_is_ignored() -> None:
    # example.com uses this trick to suppress the favicon; we must not store it.
    html = '<html><head><link rel="icon" href="data:,"></head></html>'
    meta = parse_metadata(html, base_url="https://example.com/")
    assert meta.favicon_url is None


def test_real_inline_data_uri_favicon_is_kept() -> None:
    html = (
        '<html><head><link rel="icon" '
        'href="data:image/png;base64,iVBORw0KGgo="></head></html>'
    )
    meta = parse_metadata(html, base_url="https://example.com/")
    assert meta.favicon_url == "data:image/png;base64,iVBORw0KGgo="
