import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://albdrcyjmfrbzbzopfpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYmRyY3lqbWZyYnpiem9wZnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mzk2MTAsImV4cCI6MjA4MzExNTYxMH0.M7SVuHxQCKu9nYeXTXvjEaFQ-HZhGzFy9TQCQu6Y-nU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);