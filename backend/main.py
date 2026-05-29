import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Ensure this block is added BEFORE any of your API routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-actual-app.vercel.app"  # <-- Paste your exact Origin string here
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],  # Allows Content-Type, Authorization, etc.
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase URL and Key must be set in .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class Post(BaseModel):
    author: str
    content: str
    author_avatar: Optional[str] = None
    image_url: Optional[str] = None 

class Comment(BaseModel):
    author: str
    content: str

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    email_notifs: Optional[bool] = None
    is_private: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None

@app.get("/posts")
async def get_posts():
    try:
        response = supabase.table("posts").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Fetch a single post by ID
@app.get("/posts/{post_id}")
async def get_single_post(post_id: int):
    try:
        response = supabase.table("posts").select("*").eq("id", post_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Post not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/posts")
async def create_post(post: Post):
    new_post = {
        "author_username": post.author,
        "author_avatar": post.author_avatar,
        "content": post.content,
        "image_url": post.image_url,
        "likes": [],
        "comment_count": 0
    }
    try:
        response = supabase.table("posts").insert(new_post).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, username: str):
    try:
        post_res = supabase.table("posts").select("author_username").eq("id", post_id).execute()
        if not post_res.data:
            raise HTTPException(status_code=404, detail="Post not found")
        if post_res.data[0]["author_username"] != username:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this post")
        response = supabase.table("posts").delete().eq("id", post_id).execute()
        return {"status": "success", "message": "Post deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/posts/{post_id}/like")
async def like_post(post_id: int, data: dict):
    username = data.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    try:
        post_response = supabase.table("posts").select("likes").eq("id", post_id).execute()
        if not post_response.data:
            raise HTTPException(status_code=404, detail="Post not found")
        current_likes = post_response.data[0].get("likes") or []
        
        if username in current_likes:
            current_likes.remove(username)
        else:
            current_likes.append(username)
            
        update_response = supabase.table("posts").update({"likes": current_likes}).eq("id", post_id).execute()
        return update_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: int):
    try:
        response = supabase.table("comments").select("*").eq("post_id", post_id).order("created_at", desc=False).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/posts/{post_id}/comments")
async def add_comment(post_id: int, comment: Comment):
    try:
        new_comment = {
            "post_id": post_id,
            "author_username": comment.author,
            "content": comment.content
        }
        comment_response = supabase.table("comments").insert(new_comment).execute()
        
        post_response = supabase.table("posts").select("comment_count").eq("id", post_id).execute()
        current_count = post_response.data[0].get("comment_count") or 0
        supabase.table("posts").update({"comment_count": current_count + 1}).eq("id", post_id).execute()
        
        return comment_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profiles/{username}")
async def get_profile(username: str):
    try:
        response = supabase.table("profiles").select("*").eq("username", username).execute()
        if not response.data:
            return {"bio": "Just exploring the Shimaru network.", "email_notifs": True, "is_private": False}
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profiles/{username}")
async def update_profile(username: str, profile_data: ProfileUpdate):
    try:
        data = {
            "username": username,
            "bio": profile_data.bio,
            "email_notifs": profile_data.email_notifs,
            "is_private": profile_data.is_private,
            "first_name": profile_data.first_name,
            "last_name": profile_data.last_name,
            "dob": profile_data.dob
        }
        clean_data = {k: v for k, v in data.items() if v is not None}
        response = supabase.table("profiles").upsert(clean_data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)