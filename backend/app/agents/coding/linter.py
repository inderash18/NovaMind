import ast
import logging
from typing import Tuple, Optional

logger = logging.getLogger("aetheros.agents.coding.linter")

class ASTLinter:
    """
    ASTLinter leverages Python's Abstract Syntax Tree parser to validate code blocks,
    pre-intercepting syntax bugs prior to sandboxed execution.
    """

    def validate_syntax(self, code: str) -> Tuple[bool, Optional[str]]:
        """
        Parses python code text.
        Returns: Tuple[is_valid, error_message]
        """
        if not code.strip():
            return True, None

        try:
            # Parse code into an AST node representation
            ast.parse(code)
            return True, None
        except SyntaxError as se:
            logger.warning(f"AST syntax validation error detected: {se.msg} (Line {se.lineno})")
            error_details = f"Syntax Error: {se.msg} at line {se.lineno}, col {se.offset}. Line text: '{se.text.strip() if se.text else ''}'"
            return False, error_details
        except Exception as e:
            logger.error(f"AST compiler crash: {e}")
            return False, f"AST parsing error: {str(e)}"

# Central Singleton Instance
ast_linter = ASTLinter()
