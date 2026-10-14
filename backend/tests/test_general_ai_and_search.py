import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.database.connection import AsyncSessionLocal
from backend.app.services.web_search import WebSearchService, is_safe_url
from backend.app.ai.tutor import GroundedTutorService
from backend.app.services.gamification import GamificationService


@pytest.mark.asyncio
async def test_web_search_url_safety_and_ssrf_prevention():
    """Verifies strict SSRF prevention and URL sanitization."""
    # Disallowed targets
    assert is_safe_url("http://127.0.0.1:8000/secret") is False
    assert is_safe_url("http://localhost:3000") is False
    assert is_safe_url("http://169.254.169.254/latest/meta-data") is False
    assert is_safe_url("http://10.0.0.1/admin") is False
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("javascript:alert(1)") is False

    # Allowed public authoritative domains
    assert is_safe_url("https://en.wikipedia.org/wiki/Python_(programming_language)") is True
    assert is_safe_url("https://docs.python.org/3/library/asyncio.html") is True
    assert is_safe_url("https://github.com/torvalds/linux") is True


@pytest.mark.asyncio
async def test_web_search_decision_logic():
    """Verifies when web search is triggered vs. direct reasoning."""
    # Freshness / explicit search keywords trigger search
    assert WebSearchService.should_search("What is the latest release of Python in 2026?", has_course_evidence=False) is True
    assert WebSearchService.should_search("Search web for recent advances in LLMs", has_course_evidence=True) is True
    assert WebSearchService.should_search("Lookup documentation for FastAPI", has_course_evidence=False) is True

    # Course-specific query with strong course evidence does NOT force unnecessary web search
    assert WebSearchService.should_search("Explain Coffman conditions from my slides", has_course_evidence=True) is False


@pytest.mark.asyncio
async def test_live_web_search_execution():
    """Executes live web search against authoritative sources and checks metadata integrity."""
    results = await WebSearchService.search("Computer operating systems", max_results=2)
    assert len(results) > 0, "WebSearchService must return at least 1 result for major CS query"
    for r in results:
        assert "url" in r and r["url"].startswith("http")
        assert is_safe_url(r["url"]) is True
        assert "title" in r and len(r["title"]) > 0
        assert "domain" in r and len(r["domain"]) > 0
        assert r["source_type"] == "web"


@pytest.mark.asyncio
async def test_general_purpose_ai_unconnected_question():
    """Verifies that queries unconnected to course materials are answered thoroughly without requiring course RAG."""
    async with AsyncSessionLocal() as db:
        res = await GroundedTutorService.ask(
            db=db,
            course_id=None,  # No course specified
            query="Explain Binary Search algorithm and give its time complexity",
            mode="beginner",
            scope="open"
        )
        assert res is not None
        assert "binary search" in res["answer"].lower()
        assert "log" in res["answer"].lower()
        assert len(res["related_questions"]) >= 3
        assert res["provider"] is not None


@pytest.mark.asyncio
async def test_general_purpose_ai_web_grounded_query():
    """Verifies web-grounded queries include live web sources with working URLs."""
    async with AsyncSessionLocal() as db:
        res = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="What is Artificial Intelligence in computer science?",
            mode="beginner",
            enable_web_search=True
        )
        assert res["grounded"] is True
        assert len(res["web_sources"]) > 0
        for src in res["web_sources"]:
            assert is_safe_url(src["url"]) is True
            assert src["domain"] != ""


@pytest.mark.asyncio
async def test_dynamic_related_questions():
    """Verifies that follow-up suggestions are dynamic and non-repetitive."""
    questions = GroundedTutorService.generate_related_questions(
        query="Explain Two Sum problem in C++",
        primary_concept="Hash Tables"
    )
    assert len(questions) >= 3
    assert any("hash" in q.lower() or "pointer" in q.lower() or "sum" in q.lower() for q in questions)


@pytest.mark.asyncio
async def test_arcade_games_api_and_xp():
    """Verifies the 10-game Learning Arcade API directory and XP award system."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List all 10 arcade games
        res = await client.get("/api/games")
        assert res.status_code == 200
        games = res.json()
        assert len(games) >= 10, f"Expected 10 arcade games, got {len(games)}"

        # Check required games exist
        game_ids = [g["id"] for g in games]
        assert "code_rush" in game_ids
        assert "bug_hunter" in game_ids
        assert "output_predictor" in game_ids
        assert "memory_match" in game_ids
        assert "flashcard_battle" in game_ids
        assert "algorithm_maze" in game_ids
        assert "typing_code" in game_ids
        assert "binary_battle" in game_ids
        assert "sql_detective" in game_ids
        assert "quiz_boss" in game_ids

        # 2. Fetch game payload for Code Rush
        res_rush = await client.get("/api/games/code_rush")
        assert res_rush.status_code == 200
        data_rush = res_rush.json()
        assert data_rush["tag"] == "SPEED"
        assert len(data_rush["questions"]) >= 3

        # 3. Fetch game payload for AI Quiz Boss
        res_boss = await client.get("/api/games/quiz_boss")
        assert res_boss.status_code == 200
        data_boss = res_boss.json()
        assert data_boss["tag"] == "BOSS RAID"
        assert "boss" in data_boss

        # 4. Award XP for game victory
        res_xp = await client.post("/api/games/award-xp", json={"game_type": "quiz_boss", "score": 100})
        assert res_xp.status_code == 200
        data_xp = res_xp.json()
        assert data_xp["xp_earned"] >= 10


@pytest.mark.asyncio
async def test_math_arithmetic_2_plus_2_correctness():
    """CRITICAL REGRESSION TEST: Verifies 2+2 returns 4 directly and NOT irrelevant boilerplate."""
    async with AsyncSessionLocal() as db:
        res = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="2+2",
            mode="beginner",
            scope="open"
        )
        assert res is not None
        answer = res["answer"]
        # Must contain 4
        assert "4" in answer
        # Must NEVER contain the irrelevant preconditions/governing rules boilerplate
        assert "inputs, preconditions, and governing rules" not in answer.lower()
        assert "domain invariants" not in answer.lower()
        # Related questions must be math-specific
        assert len(res["related_questions"]) >= 3
        assert any("arithmetic" in q.lower() or "math" in q.lower() or "addition" in q.lower() for q in res["related_questions"])

        # Also test with question phrasing
        res2 = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="What is 2 + 2?",
            mode="beginner",
            scope="open"
        )
        assert "4" in res2["answer"]

        # Also test multiplication
        res3 = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="calculate 15 * 4",
            mode="beginner",
            scope="open"
        )
        assert "60" in res3["answer"]


@pytest.mark.asyncio
async def test_code_generation_request():
    """Verifies that programming requests return genuine working code blocks."""
    async with AsyncSessionLocal() as db:
        res = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="Write a simple Python program to add two numbers",
            mode="beginner",
            scope="open"
        )
        assert res is not None
        answer = res["answer"]
        assert "```python" in answer
        assert "def add_numbers" in answer or "return" in answer
        assert "inputs, preconditions, and governing rules" not in answer.lower()


@pytest.mark.asyncio
async def test_foundational_definitions():
    """Verifies accurate foundational definitions for variables and photosynthesis."""
    async with AsyncSessionLocal() as db:
        # 1. Variable
        res_var = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="What is a variable?",
            mode="beginner",
            scope="open"
        )
        assert "storage" in res_var["answer"].lower() or "identifier" in res_var["answer"].lower()
        assert "inputs, preconditions, and governing rules" not in res_var["answer"].lower()

        # 2. Photosynthesis
        res_photo = await GroundedTutorService.ask(
            db=db,
            course_id=None,
            query="Define photosynthesis",
            mode="beginner",
            scope="open"
        )
        assert "glucose" in res_photo["answer"].lower() or "chlorophyll" in res_photo["answer"].lower() or "light" in res_photo["answer"].lower()
        assert "inputs, preconditions, and governing rules" not in res_photo["answer"].lower()

