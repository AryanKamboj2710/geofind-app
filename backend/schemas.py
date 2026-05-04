from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ItemBase(BaseModel):
    title: str
    description: str
    status: str
    latitude: float
    longitude: float
    contact_number: str

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    created_at: datetime
    owner_id: int

    model_config = {"from_attributes": True}

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    items: List[Item] = []

    model_config = {"from_attributes": True}

class MessageBase(BaseModel):
    content: str
    receiver_id: int
    item_id: int

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    sender_id: int
    timestamp: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
