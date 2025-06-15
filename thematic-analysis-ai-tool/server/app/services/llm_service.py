from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.runnables import Runnable
from app.schemas.llm_outputs import CodeOutput
from app.prompts.initial_coding import system_message
from app.utils.llm_provider_api_key import get_llm_provider_api_key

class LLMService:
    def __init__(self, model_name: str, provider: str = "google_genai"):
        self.model_name = model_name
        self.provider = provider
        self.llm = init_chat_model(
            model=self.model_name,
            model_provider=self.provider,
            api_key=get_llm_provider_api_key(self.provider),
        )
        prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(system_message),
                HumanMessagePromptTemplate.from_template("{text}"),
            ]
        )
        self.initial_coding_llm: Runnable = (
            prompt |
            self.llm.with_structured_output(CodeOutput)
            )

if __name__ == "__main__":
    # Trial
    llm_service = LLMService(model_name="gemini-2.0-flash")
    text_to_analyze = "Return a sample answer for testing purposes. In the reasoning, add the whole system message for testing."
    result = llm_service.initial_coding_llm.invoke({"text": text_to_analyze})
    print(result)