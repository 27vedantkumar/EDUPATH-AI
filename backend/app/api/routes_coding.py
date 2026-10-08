from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.app.security.sandbox import code_sandbox

router = APIRouter(prefix="/coding", tags=["Secure Coding Sandbox"])

class CodeExecutionRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    input_data: Optional[str] = None

@router.post("/run")
async def execute_code_snippet(req: CodeExecutionRequest):
    """
    Safely executes student code inside an isolated sandbox with resource quotas,
    AST safety inspection, and strict execution timeouts.
    """
    return code_sandbox.execute_code(
        code=req.code,
        language=req.language,
        input_data=req.input_data
    )
