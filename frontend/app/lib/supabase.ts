// frontend/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://leltomkmuyepeyxrooos.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRvbWttdXllcGV5eHJvb29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTI2MzYsImV4cCI6MjA5NTUyODYzNn0.7-3ysPy50Yr6QzHahOfcSVUv27ghmvgu8BzOJ76e4EA"

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey)