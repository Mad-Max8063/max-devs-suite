import { createClient } from '@supabase/supabase-js';

const URL = 'https://bfsttdiokdqyvwjuvcbp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w';

const supabase = createClient(URL, KEY);

async function checkTypes() {
    console.log("Checking column types via RPC or introspection...");
    
    // Check businesses.id type by trying to cast in a query if possible
    // Or just check data types in a row
    const { data: bRow } = await supabase.from('businesses').select('id').limit(1).single();
    if (bRow) {
        console.log("Business ID sample:", bRow.id, "Type:", typeof bRow.id);
    }

    const { data: gRow } = await supabase.from('gallery_images').select('card_id').limit(1).single();
    if (gRow) {
        console.log("Gallery CardID sample:", gRow.card_id, "Type:", typeof gRow.card_id);
    }

    // Try to get column info from information_schema (might fail if not authorized, but let's try)
    const { data: schema, error } = await supabase.rpc('get_column_types', { t_name: 'businesses' });
    if (error) {
        console.log("RPC get_column_types missing. Using alternative.");
    } else {
        console.log("Schema:", schema);
    }
}

checkTypes();
