import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import User, LearnerProfile, Achievement

logger = logging.getLogger("edupath.services.gamification")


class GamificationService:
    """
    Learning Games Arcade & Gamification Service.
    Awards XP, tracks streaks, and manages 10 arcade games:
    1. Code Rush (Speed Trivia)
    2. Bug Hunter (Debugging)
    3. Output Predictor (Logic)
    4. Memory Match (Concept Tiles)
    5. Flashcard Battle (Combo Multiplier)
    6. Algorithm Maze (CS Question Maze)
    7. Typing Code (WPM & Syntax)
    8. Binary Battle (Number System Conversion)
    9. SQL Detective (Murder Mystery via SQL)
    10. AI Quiz Boss (RPG Boss Raid with HP Bars)
    """

    EDUCATIONAL_GAMES = {
        # 1. Code Rush
        "code_rush": {
            "title": "Code Rush",
            "tag": "SPEED",
            "description": "Speed trivia against clock",
            "questions": [
                {
                    "q": "What is the worst-case time complexity of QuickSort?",
                    "options": ["O(N log N)", "O(N^2)", "O(N)", "O(log N)"],
                    "answer": 1,
                    "explanation": "QuickSort degrades to O(N^2) when poor pivots are chosen (e.g., sorted array with last element pivot)."
                },
                {
                    "q": "Which data structure uses LIFO (Last-In, First-Out)?",
                    "options": ["Queue", "Stack", "Binary Heap", "Linked List"],
                    "answer": 1,
                    "explanation": "A Stack operates on LIFO order."
                },
                {
                    "q": "In Python, which keyword creates an anonymous inline function?",
                    "options": ["def", "func", "lambda", "inline"],
                    "answer": 2,
                    "explanation": "lambda creates anonymous inline functions."
                },
                {
                    "q": "What is the HTTP status code for 'Resource Not Found'?",
                    "options": ["200", "403", "404", "500"],
                    "answer": 2,
                    "explanation": "404 Not Found indicates that the server cannot locate the requested resource."
                }
            ]
        },

        # 2. Bug Hunter
        "bug_hunter": {
            "title": "Bug Hunter",
            "tag": "DEBUGGING",
            "description": "Spot syntax & logical bugs",
            "challenges": [
                {
                    "id": "bug_1",
                    "language": "python",
                    "title": "Off-by-one in Array Traversal",
                    "code": "def find_max(nums):\n    max_val = nums[0]\n    for i in range(1, len(nums) + 1):  # Line 3\n        if nums[i] > max_val:         # Line 4\n            max_val = nums[i]\n    return max_val",
                    "bug_line": 3,
                    "question": "Which line causes an IndexError at runtime?",
                    "options": ["Line 1", "Line 2", "Line 3: range goes beyond valid indices", "Line 5"],
                    "answer": 2,
                    "fix": "for i in range(1, len(nums))"
                },
                {
                    "id": "bug_2",
                    "language": "python",
                    "title": "Mutable Default Parameter Hazard",
                    "code": "def append_to_list(val, items=[]):  # Line 1\n    items.append(val)             # Line 2\n    return items                  # Line 3",
                    "bug_line": 1,
                    "question": "What is the critical bug in this function definition?",
                    "options": [
                        "items=[] is evaluated once at definition time, sharing state across calls",
                        "append() is not a valid list method",
                        "return items returns a tuple",
                        "val must be typed as an integer"
                    ],
                    "answer": 0,
                    "fix": "def append_to_list(val, items=None): if items is None: items = []"
                }
            ]
        },

        # 3. Output Predictor
        "output_predictor": {
            "title": "Output Predictor",
            "tag": "LOGIC",
            "description": "Mentally execute code",
            "puzzles": [
                {
                    "id": "out_1",
                    "language": "python",
                    "code": "a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))",
                    "question": "What is printed to stdout?",
                    "options": ["3", "4", "Error", "None"],
                    "answer": 1,
                    "explanation": "Both variables 'a' and 'b' reference the exact same list in memory. Mutating 'b' mutates 'a'."
                },
                {
                    "id": "out_2",
                    "language": "python",
                    "code": "print(2 ** 3 ** 2)",
                    "question": "What is the value printed?",
                    "options": ["64", "512", "72", "128"],
                    "answer": 1,
                    "explanation": "The exponentiation operator ** is right-associative in Python: 2 ** (3 ** 2) = 2 ** 9 = 512."
                },
                {
                    "id": "out_3",
                    "language": "python",
                    "code": "x = [i * 2 for i in range(5) if i % 2 == 1]\nprint(x)",
                    "question": "What is printed?",
                    "options": ["[0, 2, 4]", "[2, 6]", "[1, 3]", "[0, 4, 8]"],
                    "answer": 1,
                    "explanation": "range(5) odd numbers are 1 and 3; multiplied by 2 gives [2, 6]."
                }
            ]
        },

        # 4. Memory Match
        "memory_match": {
            "title": "Memory Match",
            "tag": "RECALL",
            "description": "Concept definition tiles",
            "pairs": [
                {"id": "c1", "term": "Mutual Exclusion", "def": "Only one thread holds a non-shareable resource at a time"},
                {"id": "c2", "term": "Deadlock", "def": "Permanent stall where every process waits for resources held by another"},
                {"id": "c3", "term": "Semaphore", "def": "Integer variable accessed only via atomic wait() and signal() primitives"},
                {"id": "c4", "term": "Virtual Memory", "def": "Abstraction providing an illusion of a large uniform contiguous memory"},
                {"id": "c5", "term": "Thrashing", "def": "High paging activity causing CPU utilization to collapse"},
                {"id": "c6", "term": "TLB", "def": "High-speed associative hardware cache for page table translations"}
            ]
        },

        # 5. Flashcard Battle
        "flashcard_battle": {
            "title": "Flashcard Battle",
            "tag": "SPEED",
            "description": "Rapid combo multiplier",
            "cards": [
                {"id": "fb_1", "front": "What does ACID stand for in databases?", "back": "Atomicity, Consistency, Isolation, Durability"},
                {"id": "fb_2", "front": "What is the time complexity of searching in a Balanced BST (AVL/Red-Black)?", "back": "O(log N)"},
                {"id": "fb_3", "front": "Which Coffman condition is eliminated by total resource ordering?", "back": "Circular Wait"},
                {"id": "fb_4", "front": "What does DNS stand for?", "back": "Domain Name System"},
                {"id": "fb_5", "front": "In TCP, what mechanism prevents packet overflow at the receiver?", "back": "Flow Control (Sliding Window)"}
            ]
        },

        # 6. Algorithm Maze
        "algorithm_maze": {
            "title": "Algorithm Maze",
            "tag": "ADVENTURE",
            "description": "CS question maze",
            "checkpoints": [
                {
                    "step": 1,
                    "room": "Entrance Chamber",
                    "riddle": "To open the North Door, which algorithm guarantees finding the shortest path on an unweighted graph?",
                    "options": ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Prim's Algorithm", "Binary Search"],
                    "answer": 1
                },
                {
                    "step": 2,
                    "room": "Hall of Graphs",
                    "riddle": "Dijkstra's algorithm fails if the graph contains what feature?",
                    "options": ["Cycles", "Negative edge weights", "Directed edges", "Multiple components"],
                    "answer": 1
                },
                {
                    "step": 3,
                    "room": "Treasure Crypt",
                    "riddle": "Which algorithm finds the Minimum Spanning Tree by always greedily choosing the lowest weight edge overall?",
                    "options": ["Kruskal's Algorithm", "Bellman-Ford", "Floyd-Warshall", "Tarjan's SCC"],
                    "answer": 0
                }
            ]
        },

        # 7. Typing Code
        "typing_code": {
            "title": "Typing Code",
            "tag": "TYPING",
            "description": "WPM and syntax test",
            "snippets": [
                {
                    "id": "type_1",
                    "language": "python",
                    "text": "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1"
                },
                {
                    "id": "type_2",
                    "language": "javascript",
                    "text": "const debounce = (fn, delay) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delay);\n  };\n};"
                }
            ]
        },

        # 8. Binary Battle
        "binary_battle": {
            "title": "Binary Battle",
            "tag": "ARCHITECTURE",
            "description": "Number system conversion",
            "conversions": [
                {"prompt": "Binary to Decimal: 0b1011", "expected": "11", "type": "bin_to_dec"},
                {"prompt": "Decimal to Binary: 18", "expected": "10010", "type": "dec_to_bin"},
                {"prompt": "Hex to Decimal: 0x1F", "expected": "31", "type": "hex_to_dec"},
                {"prompt": "Decimal to Hex: 255", "expected": "FF", "type": "dec_to_hex"},
                {"prompt": "Bitwise AND: 0b1100 & 0b1010", "expected": "1000", "type": "bitwise"}
            ]
        },

        # 9. SQL Detective
        "sql_detective": {
            "title": "SQL Detective",
            "tag": "SQL",
            "description": "Solve murder mystery via SQL",
            "mystery": {
                "case": "The Case of the Missing Kernel Key",
                "story": "A top-secret cryptographic key was stolen from the server room at 23:45. Query the suspects and card swipe logs to discover who is guilty!",
                "tables": [
                    {
                        "name": "suspects",
                        "columns": ["id", "name", "role", "alibi"],
                        "rows": [
                            [1, "Alice Dev", "Senior Backend", "Working at desk"],
                            [2, "Bob Root", "SysAdmin", "Home sleeping"],
                            [3, "Charlie Script", "Intern", "Grabbing coffee"]
                        ]
                    },
                    {
                        "name": "swipe_logs",
                        "columns": ["log_id", "user_id", "door", "time_stamp"],
                        "rows": [
                            [101, 1, "Cafeteria", "23:40"],
                            [102, 2, "Server Room", "23:44"],
                            [103, 3, "Lobby", "23:50"]
                        ]
                    }
                ],
                "riddle": "Write a query to find the suspect who swiped into the 'Server Room' between 23:40 and 23:50:",
                "query_challenge": "SELECT s.name FROM suspects s JOIN swipe_logs l ON s.id = l.user_id WHERE l.door = 'Server Room';",
                "culprit": "Bob Root"
            }
        },

        # 10. AI Quiz Boss
        "quiz_boss": {
            "title": "AI Quiz Boss",
            "tag": "BOSS RAID",
            "description": "RPG boss fight with HP bars",
            "boss": {
                "name": "The Deadlock Dragon",
                "avatar": "🐉",
                "hp": 100,
                "player_hp": 100,
                "rounds": [
                    {
                        "q": "The dragon casts Circular Wait! How do you neutralize it?",
                        "options": [
                            "Enforce a strict linear ordering on all resource allocations",
                            "Allow unlimited resources to be spawned",
                            "Pause all processes forever",
                            "Run a denial of service attack"
                        ],
                        "answer": 0,
                        "damage": 35
                    },
                    {
                        "q": "The dragon breathes Mutual Exclusion fire! What breaks it?",
                        "options": [
                            "Make the resource shareable (e.g. read-only files or spooling)",
                            "Use a mutex lock on everything",
                            "Disable preemption",
                            "Increase priority inversion"
                        ],
                        "answer": 0,
                        "damage": 35
                    },
                    {
                        "q": "Final Boss Spell: Banker's Unsafe State! What ensures survival?",
                        "options": [
                            "Find a safe sequence <P1, P2... Pn> where each process can finish with available resources",
                            "Kill the entire operating system",
                            "Ignore maximum claim limits",
                            "Allocate without checking Work >= Need"
                        ],
                        "answer": 0,
                        "damage": 35
                    }
                ]
            }
        }
    }

    @classmethod
    async def award_xp(
        cls,
        db: AsyncSession,
        user_id: str,
        amount: int,
        reason: str
    ) -> Dict[str, Any]:
        """Awards XP for legitimate learning achievements."""
        res = await db.execute(select(LearnerProfile).filter(LearnerProfile.user_id == user_id))
        profile = res.scalars().first()
        if not profile:
            return {"xp": 0, "level": 1}

        profile.xp_points += amount
        new_level = max(1, 1 + (profile.xp_points // 300))
        leveled_up = new_level > profile.level
        profile.level = new_level

        await db.commit()
        return {
            "xp_earned": amount,
            "total_xp": profile.xp_points,
            "level": profile.level,
            "leveled_up": leveled_up,
            "reason": reason
        }

    @classmethod
    def get_game_data(cls, game_type: str) -> Dict[str, Any]:
        return cls.EDUCATIONAL_GAMES.get(game_type, cls.EDUCATIONAL_GAMES["code_rush"])

    @classmethod
    def list_games(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": k,
                "title": v.get("title", k),
                "tag": v.get("tag", "CS"),
                "description": v.get("description", "")
            }
            for k, v in cls.EDUCATIONAL_GAMES.items()
        ]
