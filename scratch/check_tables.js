import { createClient } from '@supabase/supabase-js';

const URL = 'https://bfsttdiokdqyvwjuvcbp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w';

const supabase = createClient(URL, KEY);

async function checkTables() {
    console.log("Checking tables...");
    const { data: cData, error: cErr } = await supabase.from('cards').select('id').limit(1);
    console.log("Cards table exists?", !cErr);
    
    const { data: bData, error: bErr } = await supabase.from('businesses').select('id').limit(1);
    console.log("Businesses table exists?", !bErr);
}

checkTables();
