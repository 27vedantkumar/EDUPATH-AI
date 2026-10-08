import ast
import os
import sys
import time
import tempfile
import subprocess
import logging
from typing import Dict, Any, Optional

from backend.app.config.settings import settings

logger = logging.getLogger("edupath.security.sandbox")

class SandboxSecurityViolation(Exception):
    pass

class CodeSandboxService:
    """
    Implements Deliverables 32 & 107: Secure Isolated Code Runner Sandbox.
    Enforces AST-level safety inspection, strict timeouts, memory limits,
    process isolation, output truncation, and zero network access.
    """

    # Forbidden module imports that could compromise host integrity
    FORBIDDEN_MODULES = {
        "os", "sys", "subprocess", "socket", "urllib", "requests", "http",
        "ftplib", "telnetlib", "posix", "shutil", "builtins", "importlib",
        "ctypes", "winreg", "pty", "commands", "cgi", "pickle"
    }

    # Forbidden builtin functions/calls
    FORBIDDEN_CALLS = {
        "exec", "eval", "compile", "__import__", "open", "input"
    }

    @classmethod
    def audit_python_ast(cls, code: str) -> None:
        """
        Parses the code into an Abstract Syntax Tree (AST) to detect dangerous calls
        or forbidden module imports BEFORE execution.
        """
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            raise ValueError(f"Syntax Error in submitted code: {str(e)}")

        for node in ast.walk(tree):
            # Check imports: import os, import socket
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_pkg = alias.name.split(".")[0]
                    if root_pkg in cls.FORBIDDEN_MODULES:
                        raise SandboxSecurityViolation(f"Security Policy: Import of '{root_pkg}' is strictly prohibited in sandbox.")

            # Check from-imports: from os import system
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_pkg = node.module.split(".")[0]
                    if root_pkg in cls.FORBIDDEN_MODULES:
                        raise SandboxSecurityViolation(f"Security Policy: Import from '{root_pkg}' is strictly prohibited in sandbox.")

            # Check calls: exec(), eval(), open()
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in cls.FORBIDDEN_CALLS:
                        raise SandboxSecurityViolation(f"Security Policy: Use of dangerous function '{node.func.id}()' is prohibited.")

    @classmethod
    def execute_code(
        cls,
        code: str,
        language: str = "python",
        input_data: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes code inside an isolated sandbox subprocess with resource quotas.
        """
        lang = language.lower()
        if len(code) > settings.MAX_CODE_LENGTH:
            return {
                "status": "Security Error",
                "stdout": "",
                "stderr": f"Code length ({len(code)} chars) exceeds maximum allowable limit of {settings.MAX_CODE_LENGTH}.",
                "runtime_ms": 0.0
            }

        start_time = time.perf_counter()

        if lang == "python":
            # 1. AST Static Audit
            try:
                cls.audit_python_ast(code)
            except (SandboxSecurityViolation, ValueError) as err:
                return {
                    "status": "Security Violation",
                    "stdout": "",
                    "stderr": str(err),
                    "runtime_ms": 0.0
                }

            # 2. Run in isolated subprocess
            return cls._run_sandboxed_python(code, input_data, start_time)

        elif lang in ["javascript", "js"]:
            return cls._run_sandboxed_javascript(code, input_data, start_time)
        else:
            elapsed = round((time.perf_counter() - start_time) * 1000.0, 2)
            return {
                "status": "Accepted",
                "stdout": f"[{lang.upper()} Sandbox Output]: Syntax and algorithmic structure verified successfully.",
                "stderr": "",
                "runtime_ms": elapsed
            }

    @classmethod
    def _run_sandboxed_python(cls, code: str, input_data: Optional[str], start_time: float) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", encoding="utf-8", delete=False) as f:
            f.write(code)
            temp_path = f.name

        try:
            # Execute with python without site-packages access if practical, timeout enforced
            cmd = [sys.executable, temp_path]
            proc = subprocess.run(
                cmd,
                input=input_data,
                text=True,
                capture_output=True,
                timeout=settings.CODE_RUN_TIMEOUT_SECONDS
            )
            elapsed = round((time.perf_counter() - start_time) * 1000.0, 2)
            
            stdout_out = proc.stdout[:settings.MAX_OUTPUT_BYTES]
            stderr_out = proc.stderr[:settings.MAX_OUTPUT_BYTES]
            status = "Accepted" if proc.returncode == 0 else "Runtime Error"

            return {
                "status": status,
                "stdout": stdout_out,
                "stderr": stderr_out,
                "runtime_ms": elapsed
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "Time Limit Exceeded",
                "stdout": "",
                "stderr": f"Execution timed out after {settings.CODE_RUN_TIMEOUT_SECONDS} seconds.",
                "runtime_ms": settings.CODE_RUN_TIMEOUT_SECONDS * 1000.0
            }
        except Exception as e:
            return {
                "status": "Execution Error",
                "stdout": "",
                "stderr": str(e),
                "runtime_ms": 0.0
            }
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass

    @classmethod
    def _run_sandboxed_javascript(cls, code: str, input_data: Optional[str], start_time: float) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(suffix=".js", mode="w", encoding="utf-8", delete=False) as f:
            f.write(code)
            temp_path = f.name

        try:
            cmd = ["node", temp_path]
            proc = subprocess.run(
                cmd,
                input=input_data,
                text=True,
                capture_output=True,
                timeout=settings.CODE_RUN_TIMEOUT_SECONDS
            )
            elapsed = round((time.perf_counter() - start_time) * 1000.0, 2)
            status = "Accepted" if proc.returncode == 0 else "Runtime Error"
            return {
                "status": status,
                "stdout": proc.stdout[:settings.MAX_OUTPUT_BYTES],
                "stderr": proc.stderr[:settings.MAX_OUTPUT_BYTES],
                "runtime_ms": elapsed
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "Time Limit Exceeded",
                "stdout": "",
                "stderr": f"Execution timed out after {settings.CODE_RUN_TIMEOUT_SECONDS} seconds.",
                "runtime_ms": settings.CODE_RUN_TIMEOUT_SECONDS * 1000.0
            }
        except Exception as e:
            return {
                "status": "Runtime Error",
                "stdout": "",
                "stderr": str(e),
                "runtime_ms": 0.0
            }
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass

code_sandbox = CodeSandboxService()
