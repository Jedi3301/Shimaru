from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client, Client
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SUPABASE SETUP ---
# Notice the quotation marks around the URL and Key below!
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize the database connection (expects env vars to be set)
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in the environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class NewPost(BaseModel):
    author: str
    content: str

# --- NEW: Catch Likes and Unlikes ---
@app.post("/posts/{post_id}/like")
def toggle_like(post_id: int, data: dict):
    username = data.get("username")
    if not username:
        return {"error": "Username required"}

    # 1. Check if this user has already liked this post
    existing = supabase.table("likes") \
        .select("*") \
        .eq("post_id", post_id) \
        .eq("liker_username", username) \
        .execute()

    if existing.data:
        # User already liked it! This means they are clicking it again to UNLIKE.
        supabase.table("likes") \
            .delete() \
            .eq("post_id", post_id) \
            .eq("liker_username", username) \
            .execute()
        return {"status": "unliked"}
    else:
        # User hasn't liked it yet. Add a new row to the table!
        supabase.table("likes") \
            .insert({
                "post_id": post_id,
                "liker_username": username
            }) \
            .execute()
        return {"status": "liked"}

@app.get("/posts")
def get_posts():
    # 1. The magical Supabase Join query!
    # It fetches the post, PLUS the usernames of everyone who liked it, PLUS the comments
    response = supabase.table("posts").select(
        "*, likes(liker_username), comments(id)"
    ).order("id", desc=True).execute() # desc=True puts the newest posts at the top!
    
    # 2. Format the data cleanly for Next.js
    formatted_posts = []
    for post in response.data:
        # Extract just the usernames into a neat list: ["Jedi", "Akshaya"]
        likers = [like["liker_username"] for like in post.get("likes", [])]
        
        # Count how many comments exist
        comment_count = len(post.get("comments", []))
        
        formatted_posts.append({
            "id": post["id"],
            "author": post["author"],
            "content": post["content"],
            "initialLikes": likers,
            "commentCount": comment_count
        })
        
    return formatted_posts
    
@app.post("/posts")
def create_post(post: NewPost):
    response = supabase.table("posts").insert({
        "author": post.author,
        "content": post.content,
        "likes": 0
    }).execute()
    return response.data

# --- NEW: Comment System Endpoints ---

@app.get("/posts/{post_id}/comments")
def get_comments(post_id: int):
    # Fetch all comments for this specific post, oldest first (like a standard chat)
    response = supabase.table("comments") \
        .select("*") \
        .eq("post_id", post_id) \
        .order("created_at", desc=False) \
        .execute()
    
    return response.data

@app.post("/posts/{post_id}/comments")
def add_comment(post_id: int, data: dict):
    author = data.get("author")
    content = data.get("content")
    
    if not author or not content:
        return {"error": "Author and content required"}
        
    # Insert the new comment into Supabase
    response = supabase.table("comments") \
        .insert({
            "post_id": post_id,
            "author_username": author,
            "content": content
        }) \
        .execute()
        
    # Return the newly created comment so the frontend can display it instantly
    return response.data[0]