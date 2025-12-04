import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ixryiuxqvdcauqagwgpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cnlpdXhxdmRjYXVxYWd3Z3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzkzMTcsImV4cCI6MjA4MDM1NTMxN30.SWjdmV9F4bmek-g0A61lNsA_ANkI0eMUkmXqtGQt4mI'

export const supabase = createClient(supabaseUrl, supabaseKey)