from sqlalchemy.orm import Session
from app.services.llm_service import LLMService
from app.services.document_segment_service import DocumentSegmentService
from app.schemas.llm_outputs import CodeOutput
from app.services.code_assignment_service import CodeAssignmentService, SmartQuoteCodeAssignment


class AICodingService:

    @staticmethod
    def generate_code(
        document_ids: list[int],
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> list[dict]:
        results: list[dict] = []
        llm_service = LLMService(model_name=model_name, provider=provider)
        for doc_id in document_ids:
            segments = DocumentSegmentService.get_document_segments(doc_id, db=db)
            for seg in segments:
                llm_response: CodeOutput = llm_service.initial_coding_llm.invoke(
                    {"text": seg.content})

                # Infer quote start/end within segment content
                quote_text = llm_response.quote
                start_idx = seg.content.find(quote_text)
                if start_idx < 0:
                    start_idx = 0
                end_idx = start_idx + len(quote_text)

                # Build assignment request
                request = SmartQuoteCodeAssignment(
                    document_id=seg.document_id,
                    segment_id=seg.id,
                    text=quote_text,
                    start_char=start_idx,
                    end_char=end_idx,
                    code_name=llm_response.code,
                    code_description=llm_response.code_description,
                )
                assignment = CodeAssignmentService.smart_quote_code_assignment(
                    db=db,
                    request=request,
                    user_id=user_id,
                    is_auto_generated=True
                )
                # Collect result
                results.append({
                    "segment_id": seg.id,
                    "code_id": assignment.get("code", {}).get("id"),
                    "quote_id": assignment.get("quote", {}).get("id"),
                    "reasoning": llm_response.reasoning,
                    "message": assignment.get("message")
                })
        return results

    @staticmethod
    def generate_themes(code):
        pass
