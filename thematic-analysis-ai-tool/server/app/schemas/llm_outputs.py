from pydantic import BaseModel, Field

class CodeOutput(BaseModel):
    """
    Represents the output of a code creation.
    """
    reasoning: str = Field(description="The reasoning behind the code generation.")
    code: str = Field(description="The assigned/generated code.")
    quote: str = Field(description="Exact quote from the passage that the code is attached to.")
    code_description: str = Field(description="Description of the code, explaining how it relates to the quote.")