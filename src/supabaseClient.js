import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://azhjsyaolfoqmuyulwug.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aGpzeWFvbGZvcW11eXVsd3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjE5OTMsImV4cCI6MjA3NzM5Nzk5M30.f73plY5hXoo0er5I0CUC74Ijmd1FRApUK7Vp-LYGtZc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
