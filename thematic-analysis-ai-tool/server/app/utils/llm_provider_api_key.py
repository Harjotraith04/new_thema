from app.core.config import settings

def get_llm_provider_api_key(provider: str) -> str:
    if(provider == "google_genai"):
        return settings.GOOGLE_API_KEY
    # elif(provider == "openai"):
    #     return settings.OPENAI_API_KEY
    # elif(provider == "anthropic"):
    #     return settings.ANTHROPIC_API_KEY
    # elif(provider == "groq"):
    #     return settings.GROQ_API_KEY
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}. Supported providers are: google_genai, openai, anthropic, groq.")