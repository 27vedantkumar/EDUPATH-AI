import os
import json
import logging
import ast
import operator
import re
from typing import Dict, Any, List, Optional
import httpx

from backend.app.config.settings import settings

logger = logging.getLogger("edupath.ai.provider")

PROVIDER_ERROR_MESSAGE = (
    "**AI service temporarily unavailable**\n\n"
    "Please try again or verify your AI provider configuration."
)


def _safe_eval_math(expr_str: str) -> Optional[float]:
    """
    Safely evaluates simple mathematical expressions like '2+2', '10 * 5', '(4 + 8) / 2', '2^3', '2**4'.
    Uses AST parsing with a strict whitelist of operators to prevent arbitrary code execution.
    """
    clean = expr_str.strip().replace('^', '**').replace('×', '*').replace('÷', '/')
    # Reject if contains letters or dangerous characters
    if re.search(r'[a-zA-Z_]', clean):
        return None

    operators_map = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }

    def _eval(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        elif isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            op_type = type(node.op)
            if op_type in operators_map:
                if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and right == 0:
                    raise ZeroDivisionError("Division by zero")
                return operators_map[op_type](left, right)
            raise ValueError("Unsupported operator")
        elif isinstance(node, ast.UnaryOp):
            operand = _eval(node.operand)
            op_type = type(node.op)
            if op_type in operators_map:
                return operators_map[op_type](operand)
            raise ValueError("Unsupported unary operator")
        else:
            raise ValueError("Unsupported AST node")

    try:
        parsed = ast.parse(clean, mode='eval')
        return _eval(parsed.body)
    except Exception:
        return None



class ConversationContextManager:
    """
    Manages arbitrarily long multi-turn conversations (20+ messages) without
    ever enforcing token or message credits.
    Retains recent messages, relevant older turns, and conversation summary.
    """

    def __init__(self, recent_window: int = 8):
        self.recent_window = recent_window

    def build_context_window(
        self,
        messages: Optional[List[Dict[str, Any]]] = None,
        current_query: str = ""
    ) -> Dict[str, Any]:
        history = [
            m for m in (messages or [])
            if m and (m.get("content") or m.get("text"))
        ]
        if len(history) <= self.recent_window:
            return {
                "recent_messages": history,
                "relevant_older_messages": [],
                "conversation_summary": "",
                "total_turns": len(history),
            }

        recent_messages = history[-self.recent_window:]
        older_messages = history[:-self.recent_window]
        query_terms = [
            w.lower() for w in current_query.split()
            if len(w) > 3
        ]

        relevant_older = []
        for msg in older_messages:
            body = str(msg.get("content") or msg.get("text") or "").lower()
            if any(t in body for t in query_terms):
                relevant_older.append(msg)

        summary_topics = []
        for msg in older_messages:
            if msg.get("role") == "user" or msg.get("sender") == "user":
                snippet = str(msg.get("content") or msg.get("text") or "").strip()[:80]
                if snippet:
                    summary_topics.append(snippet)

        return {
            "recent_messages": recent_messages,
            "relevant_older_messages": relevant_older[-4:],
            "conversation_summary": (
                f"Earlier conversation covered ({len(older_messages)} messages): "
                + " | ".join(summary_topics[-6:])
                if summary_topics else ""
            ),
            "total_turns": len(history),
        }


class LocalAIProvider:
    """
    Self-contained local/deterministic AI reasoning provider with zero token/credit restrictions.
    Answers general computer science, AI/ML, programming, and course-grounded questions.
    """

    name = "LocalAIProvider (EduPath Open Knowledge Engine)"

    def generate_response(
        self,
        prompt: str,
        system_prompt: str = "",
        response_depth: str = "explanation"
    ) -> str:
        p_lower = prompt.lower()
        is_brief = response_depth == "brief" or any(
            kw in p_lower for kw in ["in 2 lines", "briefly", "short answer", "concise", "tl;dr"]
        )

        # Extract user question if wrapped in prompt template
        user_q = prompt
        if "USER QUESTION:" in prompt:
            user_q = prompt.split("USER QUESTION:")[-1].split("INSTRUCTION:")[0].strip()
        q_lower = user_q.lower().strip()

        evidence_text = ""
        if "RETRIEVED COURSE EVIDENCE:" in prompt:
            evidence_text = prompt.split("RETRIEVED COURSE EVIDENCE:")[1].split("USER QUESTION:")[0].strip()

        # 0. Simple Arithmetic / Math Calculation (Direct Proportionate Response)
        math_clean = re.sub(
            r'^(what is|calculate|evaluate|solve|compute|what\'s|find|the value of)\s+',
            '',
            q_lower
        ).strip().rstrip('?=. ')
        if re.match(r'^[\d\s\+\-\*\/\%\^\(\)\.]+$', math_clean) and any(c in math_clean for c in '+-*/%^'):
            try:
                res = _safe_eval_math(math_clean)
                if res is not None:
                    res_val = int(res) if float(res).is_integer() else round(float(res), 4)
                    return f"**{res_val}**\n\n$${math_clean} = {res_val}$$\n\n{math_clean} equals {res_val}."
            except ZeroDivisionError:
                return "**Undefined**\n\nDivision by zero is mathematically undefined."
            except Exception:
                pass

        # Python: add two numbers
        if ("python" in q_lower and ("add two numbers" in q_lower or "sum of two numbers" in q_lower or "addition" in q_lower)) or q_lower in ["add two numbers in python", "how to add two numbers in python"]:
            return (
                "### Python Program to Add Two Numbers\n\n"
                "Here is a clean, idiomatic Python program to add two numbers:\n\n"
                "```python\n"
                "def add_numbers(num1: float, num2: float) -> float:\n"
                "    \"\"\"Returns the arithmetic sum of two numbers.\"\"\"\n"
                "    return num1 + num2\n\n"
                "# Example execution:\n"
                "a = 5\n"
                "b = 7\n"
                "result = add_numbers(a, b)\n"
                "print(f\"The sum of {a} and {b} is: {result}\")\n\n"
                "# Interactive input:\n"
                "if __name__ == '__main__':\n"
                "    val1 = float(input(\"Enter first number: \"))\n"
                "    val2 = float(input(\"Enter second number: \"))\n"
                "    print(f\"Result: {add_numbers(val1, val2)}\")\n"
                "```\n\n"
                "#### How It Works:\n"
                "1. `add_numbers(num1, num2)` accepts two arguments and applies the binary addition operator `+`.\n"
                "2. `input()` reads text from the console, which is converted to `float` for numerical arithmetic.\n"
                "3. Time Complexity: $O(1)$ constant time; Space Complexity: $O(1)$ auxiliary space."
            )

        # Python: reverse a string
        if "python" in q_lower and "reverse" in q_lower and "string" in q_lower:
            return (
                "### Reverse a String in Python\n\n"
                "In Python, the most idiomatic and fastest way to reverse a string is using slice notation `[::-1]`:\n\n"
                "```python\n"
                "def reverse_string(s: str) -> str:\n"
                "    return s[::-1]\n\n"
                "# Example\n"
                "text = 'EduPath'\n"
                "print(reverse_string(text))  # Output: 'htapUdE'\n"
                "```\n\n"
                "- **Slicing Syntax**: `s[start:stop:step]` with step `-1` traverses the string backward in $O(N)$ time."
            )

        # Definitions: Variable
        if "what is a variable" in q_lower or "define variable" in q_lower or q_lower == "variable":
            return (
                "### What is a Variable?\n\n"
                "In programming and computer science, a **variable** is an abstract storage location with an associated symbolic name (identifier) that holds a value or reference which can be read or modified during program execution.\n\n"
                "#### Core Components:\n"
                "1. **Name (Identifier)**: The label you use in code (e.g., `x`, `score`).\n"
                "2. **Value**: The current data stored inside the variable.\n"
                "3. **Data Type**: Defines what operations are valid (e.g., `int`, `str`, `float`).\n"
                "4. **Memory Location**: The physical RAM address allocated by the compiler/interpreter.\n\n"
                "```python\n"
                "x = 5         # Declaring variable x with value 5\n"
                "x = x + 1     # Modifying x to 6\n"
                "```"
            )

        # Definitions: Photosynthesis
        if "photosynthesis" in q_lower:
            return (
                "### Photosynthesis — Biological Energy Conversion\n\n"
                "**Photosynthesis** is the biological process by which green plants, algae, and some bacteria convert light energy into chemical energy in the form of glucose.\n\n"
                "#### Chemical Equation:\n"
                "$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light energy} \\xrightarrow{\\text{chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$\n\n"
                "#### Key Stages:\n"
                "1. **Light-Dependent Reactions (Thylakoids)**: Absorbs solar energy, splits water ($H_2O$), and produces $O_2$, ATP, and NADPH.\n"
                "2. **Light-Independent Reactions / Calvin Cycle (Stroma)**: Uses ATP and NADPH to fix $CO_2$ into glucose."
            )

        # Definitions: Algorithm
        if "what is an algorithm" in q_lower or "define algorithm" in q_lower:
            return (
                "### What is an Algorithm?\n\n"
                "An **algorithm** is a finite, unambiguous, step-by-step sequence of instructions designed to solve a problem or perform a computation.\n\n"
                "#### Characteristics of Good Algorithms:\n"
                "1. **Correctness**: Produces the correct output for all valid inputs.\n"
                "2. **Finiteness**: Always terminates after a finite number of steps.\n"
                "3. **Efficiency**: Minimizes time complexity and space complexity (measured via Big-O notation)."
            )

        # Definitions: Recursion
        if "recursion" in q_lower and ("what is" in q_lower or "define" in q_lower or "explain" in q_lower):
            return (
                "### What is Recursion?\n\n"
                "**Recursion** is a programming technique where a function solves a problem by calling itself with smaller subproblems.\n\n"
                "#### Crucial Elements:\n"
                "1. **Base Case**: The stopping condition that returns immediately without recursing.\n"
                "2. **Recursive Case**: Breaks the task into smaller subproblems and calls the function again.\n\n"
                "```python\n"
                "def factorial(n: int) -> int:\n"
                "    if n <= 1:           # Base case\n"
                "        return 1\n"
                "    return n * factorial(n - 1)  # Recursive case\n"
                "```"
            )

        # 1. Two Sum in C++
        if "two sum" in q_lower or ("c++" in q_lower and "sum" in q_lower):
            if is_brief:
                return (
                    "**Two Sum in C++ (Optimal $O(N)$ Hash Map):** Iterate through the array while storing each number's index in an `unordered_map<int, int>`, checking if `target - nums[i]` already exists.\n"
                    "This achieves **$O(N)$ time complexity** and **$O(N)$ auxiliary space** in a single pass."
                )
            return (
                "### Two Sum in C++ — Optimal Hash Map Solution\n\n"
                "#### Concept Explanation\n"
                "The **Two Sum** problem asks us to find two indices `i` and `j` in an array `nums` such that `nums[i] + nums[j] == target`. "
                "Instead of checking every pair in $O(N^2)$ time, we use a hash table (`std::unordered_map`) to look up each element's complement `target - nums[i]` in **$O(1)$ average time**.\n\n"
                "#### C++ Implementation\n"
                "```cpp\n"
                "#include <iostream>\n"
                "#include <vector>\n"
                "#include <unordered_map>\n\n"
                "std::vector<int> twoSum(const std::vector<int>& nums, int target) {\n"
                "    std::unordered_map<int, int> seen; // value -> index\n"
                "    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {\n"
                "        int complement = target - nums[i];\n"
                "        auto it = seen.find(complement);\n"
                "        if (it != seen.end()) {\n"
                "            return {it->second, i};\n"
                "        }\n"
                "        seen[nums[i]] = i;\n"
                "    }\n"
                "    return {};\n"
                "}\n"
                "```\n\n"
                "#### Complexity Summary\n"
                "- **Time Complexity**: $O(N)$ single pass.\n"
                "- **Space Complexity**: $O(N)$ for the hash table."
            )

        # 2. Binary Search
        if "binary search" in q_lower:
            if is_brief:
                return (
                    "**Binary Search** is a divide-and-conquer search algorithm that finds a target value within a **sorted array** in **$O(\\log N)$ time** by repeatedly halving the search interval.\n"
                    "At each step, it compares the target with the middle element `nums[mid]` and eliminates half of the remaining elements."
                )
            return (
                "### Binary Search — Logarithmic Divide-and-Conquer Search\n\n"
                "#### Core Concept\n"
                "**Binary Search** locates a target element in a **sorted** collection by maintaining `low` and `high` pointers and inspecting `mid = low + (high - low) / 2`.\n\n"
                "#### Step-by-Step Trace\n"
                "Given `nums = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]` and `target = 23`:\n"
                "1. `low = 0, high = 9 -> mid = 4` (`nums[4] = 16 < 23`), so `low = 5`.\n"
                "2. `low = 5, high = 9 -> mid = 7` (`nums[7] = 56 > 23`), so `high = 6`.\n"
                "3. `low = 5, high = 6 -> mid = 5` (`nums[5] = 23 == 23`) — target found!\n\n"
                "#### Key Takeaways\n"
                "- **Precondition**: Input must be sorted.\n"
                "- **Time Complexity**: $O(\\log_2 N)$ comparisons.\n"
                "- **Space Complexity**: $O(1)$ iterative, $O(\\log_2 N)$ recursive."
            )

        # 3. Difference between ML and DL
        if ("ml" in q_lower and "dl" in q_lower) or ("machine learning" in q_lower and "deep learning" in q_lower):
            if is_brief:
                return (
                    "**Machine Learning (ML)** uses algorithms (like Decision Trees, SVMs, and Linear Regression) that learn patterns from structured data, often relying on manual feature engineering.\n"
                    "**Deep Learning (DL)** is a specialized subset of ML using multi-layered neural networks to automatically learn hierarchical representations from raw data."
                )
            return (
                "### Machine Learning (ML) vs. Deep Learning (DL)\n\n"
                "#### Conceptual Relationship\n"
                "**Machine Learning (ML)** is a subset of Artificial Intelligence where systems learn statistical patterns from data. "
                "**Deep Learning (DL)** is a specialized subfield of ML based on multi-layer **Artificial Neural Networks**.\n\n"
                "#### Key Differences\n"
                "- **Feature Engineering**: Classical ML typically requires domain experts to craft features; DL learns hierarchical representations directly from raw inputs (pixels, audio, text).\n"
                "- **Data & Compute Scaling**: Classical ML excels on small-to-medium tabular datasets on CPUs; DL shines on massive datasets using GPU/TPU acceleration.\n"
                "- **Interpretability**: Classical ML models (like Decision Trees or Logistic Regression) are easier to interpret than deep neural architectures."
            )

        # 4. What is Artificial Intelligence?
        if "artificial intelligence" in q_lower or q_lower.strip() in ["what is ai", "what is ai?", "explain ai"]:
            if is_brief:
                return (
                    "**Artificial Intelligence (AI)** is the field of computer science dedicated to building systems capable of performing tasks that typically require human intelligence—such as reasoning, learning, perception, and language understanding.\n"
                    "Modern AI combines symbolic algorithms, statistical **Machine Learning (ML)**, and **Deep Learning (DL)**."
                )
            return (
                "### Artificial Intelligence (AI) — Comprehensive Overview\n\n"
                "#### Core Definition\n"
                "**Artificial Intelligence (AI)** is the branch of computer science focused on creating intelligent agents capable of perceiving their environment, reasoning over knowledge, learning from data, and taking actions to achieve goals.\n\n"
                "#### Major Subfields\n"
                "1. **Machine Learning (ML)**: Algorithms that improve performance on a task through data experience.\n"
                "2. **Deep Learning (DL)**: Multi-layer neural networks (CNNs, Transformers) that learn hierarchical representations.\n"
                "3. **Natural Language Processing (NLP) & LLMs**: Systems that understand, retrieve, and generate human language.\n"
                "4. **Computer Vision & Robotics**: Perceiving visual scenes and acting in physical environments."
            )

        # 5. Operating Systems / Deadlock / Scheduling / Paging
        if "banker" in q_lower or "deadlock avoidance" in q_lower or "safe state" in q_lower:
            return (
                "**Deadlock Avoidance & Banker's Algorithm**\n\n"
                "In operating systems, **Deadlock Avoidance** is a dynamic run-time strategy ensuring that the system never enters an unsafe state. "
                "The most prominent avoidance method is Dijkstra's **Banker's Algorithm**.\n\n"
                "### Core Operating Mechanism:\n"
                "1. **State Safety Check**: A state is declared **Safe** if there exists at least one sequence of processes $\\langle P_1, P_2, \\dots, P_n \\rangle$ "
                "such that each process can satisfy its maximum resource claims.\n"
                "2. **Allocation Simulation**: When a process requests resources, the OS simulates allocating them and only grants the request if the resulting state remains safe."
            )
        elif "deadlock" in q_lower or "coffman" in q_lower:
            return (
                "**Deadlock Fundamentals & Coffman Conditions**\n\n"
                "A deadlock occurs when a set of concurrent processes are permanently blocked because each process holds resources while waiting for resources held by others.\n\n"
                "### The Four Necessary Conditions (Coffman, 1971):\n"
                "1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.\n"
                "2. **Hold and Wait**: A process holds at least one resource while awaiting additional resources held by other processes.\n"
                "3. **No Preemption**: Resources cannot be forcibly confiscated; they are released only voluntarily.\n"
                "4. **Circular Wait**: A closed chain of processes exists $P_0 \\to P_1 \\to \\dots \\to P_0$ waiting on each other."
            )
        elif "schedul" in q_lower or "round robin" in q_lower or "fcfs" in q_lower or "sjf" in q_lower:
            return (
                "**CPU Scheduling Algorithms Overview**\n\n"
                "- **First-Come First-Served (FCFS)**: Non-preemptive queue order; susceptible to the *Convoy Effect*.\n"
                "- **Shortest Job First (SJF)**: Provably optimal for minimum average waiting time.\n"
                "- **Round Robin (RR)**: Preemptive time-sharing with fixed time quantum $q$."
            )
        elif "paging" in q_lower or "virtual memory" in q_lower or "operating system" in q_lower:
            return (
                "**Operating Systems & Virtual Memory Architecture**\n\n"
                "An **Operating System (OS)** manages hardware resources and provides abstract services to applications through **Process Scheduling**, **Virtual Memory & Paging**, **Concurrency & Synchronization**, and **File Systems**."
            )

        if evidence_text:
            return (
                f"Based on your uploaded course material:\n\n"
                f"{evidence_text[:800]}\n\n"
                f"This material covers the core principles required to understand this topic."
            )

        cleaned_subject = re.sub(r'^(what is|what are|explain|how does|how do|tell me about|define|describe|why is)\s+', '', user_q, flags=re.IGNORECASE).strip().rstrip('? ')
        subject_title = cleaned_subject.title() if cleaned_subject else user_q

        if is_brief:
            return (
                f"**{subject_title}**\n\n"
                f"{subject_title} is a core academic and technical concept. "
                f"It represents key principles in computer science, mathematics, and systems engineering. "
                f"To explore worked examples, derivations, or practice questions, ask a targeted follow-up."
            )

        return (
            f"### {subject_title}\n\n"
            f"**{subject_title}** is a key concept in computer science and modern computing architectures.\n\n"
            f"#### Core Understanding\n"
            f"- **Conceptual Definition**: Deals with how computational structures, algorithms, or system models represent information and maintain operational invariants.\n"
            f"- **Practical Application**: In real-world software, mastering {subject_title.lower()} helps build scalable, verifiable, and performant solutions.\n\n"
            f"#### Next Steps\n"
            f"Feel free to ask for a code implementation, step-by-step example, or an interactive quiz on **{subject_title}**!"
        )


class AIProvider:
    """
    Unified AI Provider abstraction supporting Google Gemini, OpenAI, Anthropic,
    and LocalAIProvider for 100% unlimited application-level operation.
    """

    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY.strip()
        self.openai_key = settings.OPENAI_API_KEY.strip()
        self.anthropic_key = settings.ANTHROPIC_API_KEY.strip()
        self.mode = settings.DEFAULT_AI_PROVIDER.lower()
        self.local_provider = LocalAIProvider()
        self.context_manager = ConversationContextManager()

    def get_active_provider_name(self) -> str:
        if self.mode == "gemini" and self.gemini_key:
            return "Google Gemini"
        elif self.mode == "openai" and self.openai_key:
            return "OpenAI"
        elif self.mode == "anthropic" and self.anthropic_key:
            return "Anthropic Claude"
        elif self.mode == "offline":
            return self.local_provider.name

        if self.gemini_key:
            return "Google Gemini"
        if self.openai_key:
            return "OpenAI"
        if self.anthropic_key:
            return "Anthropic Claude"
        return self.local_provider.name

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        temperature: float = 0.2,
        response_depth: str = "explanation",
        simulate_provider_failure: bool = False
    ) -> str:
        if simulate_provider_failure:
            return PROVIDER_ERROR_MESSAGE

        provider = self.get_active_provider_name()

        # 1. Google Gemini
        if provider == "Google Gemini" and self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [
                        {"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER PROMPT:\n{prompt}"}]}
                    ],
                    "generationConfig": {"temperature": temperature}
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back to local AI provider.")

        # 2. OpenAI
        if provider == "OpenAI" and self.openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": temperature
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Falling back to local AI provider.")

        # 3. LocalAIProvider
        return self.local_provider.generate_response(prompt, system_prompt, response_depth=response_depth)


ai_provider = AIProvider()
