import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ufjqetecjvqklhbjkxqz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmanFldGVjanZxa2xoYmpreHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjczOTcsImV4cCI6MjA0ODIwMzM5N30.-C-kJMeegNi5TbSuM0Vz2uqGUP5Q4EkjC6LO85Zh7TU";

export const supabase = createClient(supabaseUrl, supabaseKey);