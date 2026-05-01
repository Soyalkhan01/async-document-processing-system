from pydantic import BaseModel

class DocumentResponse(BaseModel):

    id: int
    filename: str
    file_type: str
    file_size: int
    status: str

    class Config:
        from_attributes = True

class UpdateDocumentRequest(BaseModel):

    extracted_data: str    