from sqlalchemy import Column, Integer, String, Text, Boolean
from .database import Base

class Document(Base):

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)

    filename = Column(String)

    file_type = Column(String)

    file_size = Column(Integer)

    status = Column(String, default="queued")

    extracted_data = Column(Text)

    finalized = Column(Boolean, default=False)