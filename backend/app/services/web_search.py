import re
import urllib.parse
import ipaddress
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("edupath.services.web_search")

DISALLOWED_HOSTS = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"
}

AUTHORITATIVE_DOMAINS = {
    "wikipedia.org", "python.org", "docs.python.org", "developer.mozilla.org",
    "github.com", "arxiv.org", "mit.edu", "stanford.edu", "harvard.edu",
    "acm.org", "ieee.org", "w3.org", "kubernetes.io", "rust-lang.org",
    "react.dev", "nodejs.org", "golang.org", "fastapi.tiangolo.com"
}


def is_safe_url(url_str: str) -> bool:
    """
    Validates that a URL is safe to present to users and fetch:
    - Protocol must be http or https
    - Host cannot be loopback, private IPv4/IPv6, or metadata address (SSRF prevention)
    """
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower()
        if not hostname or hostname in DISALLOWED_HOSTS:
            return False

        # Check for private IP ranges
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            # Not an IP literal, it's a domain name
            pass

        return True
    except Exception:
        return False


class WebSearchService:
    """
    Integrates genuine, reliable live web search with primary and authoritative sources.
    Never fabricates search results, URLs, or citations.
    """

    SEARCH_TRIGGER_TERMS = [
        "latest", "recent", "news", "today", "current", "release",
        "2024", "2025", "2026", "who is", "what is happening", "price of",
        "documentation", "docs", "changelog", "github", "how to install",
        "search web", "lookup", "browse online", "search for", "find info on"
    ]

    @classmethod
    def should_search(cls, query: str, has_course_evidence: bool = False, explicit_search: bool = False) -> bool:
        """
        Determines whether a query needs live web research.
        If user explicitly asks to search or query includes freshness/documentation keywords, returns True.
        """
        if explicit_search:
            return True

        q_lower = query.lower()
        if any(term in q_lower for term in cls.SEARCH_TRIGGER_TERMS):
            return True

        # If user asks a general question and there is no strong course evidence
        if not has_course_evidence and len(query.strip().split()) >= 3:
            # Check for factual query indicators (e.g. what is, how does, who, when)
            if any(q_lower.startswith(w) for w in ["what is", "who is", "when did", "where is", "how does", "explain the latest"]):
                return True

        return False

    @classmethod
    async def search(cls, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Executes live web search using authoritative, public sources (Wikipedia REST API + DuckDuckGo Lite).
        Returns actual titles, URLs, domains, snippets, and timestamps where available.
        Never hallucinates or mocks results.
        """
        results: List[Dict[str, Any]] = []
        cleaned_query = re.sub(r'[^a-zA-Z0-9\s\-_]', ' ', query).strip()
        if not cleaned_query:
            return []

        # 1. Authoritative Source: Wikipedia Knowledge API
        try:
            wiki_results = await cls._search_wikipedia(cleaned_query, limit=2)
            for r in wiki_results:
                if is_safe_url(r["url"]):
                    results.append(r)
        except Exception as e:
            logger.debug(f"Wikipedia search query '{cleaned_query}' had error: {e}")

        # 2. General Live Web Source: DuckDuckGo HTML / Instant Answers
        if len(results) < max_results:
            try:
                ddg_results = await cls._search_duckduckgo(cleaned_query, limit=max_results - len(results))
                for r in ddg_results:
                    if is_safe_url(r["url"]) and not any(existing["url"] == r["url"] for existing in results):
                        results.append(r)
            except Exception as e:
                logger.debug(f"DuckDuckGo search query '{cleaned_query}' had error: {e}")

        # Limit to max_results and assign deterministic index
        final_results = []
        for idx, res in enumerate(results[:max_results], 1):
            res["citation_id"] = idx
            res["source_type"] = "web"
            final_results.append(res)

        return final_results

    @classmethod
    async def _search_wikipedia(cls, query: str, limit: int = 2) -> List[Dict[str, Any]]:
        """Searches Wikipedia API for authoritative encyclopedic and scientific articles."""
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "utf8": 1,
            "srlimit": limit
        }
        headers = {
            "User-Agent": "EduPathAI/2.0 (Multimodal Learning Companion; contact@edupath.ai)"
        }

        async with httpx.AsyncClient(timeout=4.5) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code != 200:
                return []
            data = resp.json()
            search_items = data.get("query", {}).get("search", [])

            results = []
            for item in search_items:
                title = item.get("title", "")
                snippet_raw = item.get("snippet", "")
                snippet_clean = re.sub(r'<[^>]+>', '', snippet_raw).replace('&quot;', '"').replace('&#039;', "'")
                page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"

                results.append({
                    "title": f"{title} — Wikipedia",
                    "url": page_url,
                    "domain": "en.wikipedia.org",
                    "snippet": snippet_clean,
                    "is_authoritative": True,
                    "timestamp": item.get("timestamp", "")
                })
            return results

    @classmethod
    async def _search_duckduckgo(cls, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Queries DuckDuckGo HTML for real general web search results."""
        url = "https://html.duckduckgo.com/html/"
        data = {"q": query}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        async with httpx.AsyncClient(timeout=4.5, follow_redirects=True) as client:
            resp = await client.post(url, data=data, headers=headers)
            if resp.status_code != 200:
                return []

            text = resp.text
            results = []

            # Extract result blocks using regex patterns from DuckDuckGo HTML
            # Results typically have class="result__title" with an <a class="result__url" href="...">
            pattern = re.compile(
                r'<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?'
                r'<a[^>]+class="result__snippet"[^>]+href="[^"]*"[^>]*>(.*?)</a>',
                re.DOTALL
            )

            # Secondary pattern if structure differs
            link_pattern = re.compile(
                r'<a[^>]+class="result__snippet"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
                re.DOTALL
            )

            # DuckDuckGo links often come as //duckduckgo.com/l/?uddg=REAL_URL&rut=...
            # We extract the actual destination URL
            raw_matches = re.findall(r'<a class="result__snippet"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', text, re.DOTALL)
            title_matches = re.findall(r'<h2 class="result__title">\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', text, re.DOTALL)

            for i in range(min(limit, len(title_matches))):
                raw_href, raw_title = title_matches[i]
                snippet = raw_matches[i][1] if i < len(raw_matches) else ""

                actual_url = raw_href
                if "uddg=" in raw_href:
                    qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                    if "uddg" in qs and qs["uddg"]:
                        actual_url = qs["uddg"][0]

                if not is_safe_url(actual_url):
                    continue

                parsed = urllib.parse.urlparse(actual_url)
                domain = parsed.hostname or ""

                clean_title = re.sub(r'<[^>]+>', '', raw_title).strip()
                clean_snippet = re.sub(r'<[^>]+>', '', snippet).strip()

                if clean_title and actual_url:
                    results.append({
                        "title": clean_title,
                        "url": actual_url,
                        "domain": domain,
                        "snippet": clean_snippet[:260],
                        "is_authoritative": any(domain.endswith(auth) for auth in AUTHORITATIVE_DOMAINS),
                        "timestamp": None
                    })

            return results
