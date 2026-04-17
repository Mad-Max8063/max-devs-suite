import { createClient } from '@supabase/supabase-js';

const URL = 'https://bfsttdiokdqyvwjuvcbp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w';

const supabase = createClient(URL, KEY);

async function check() {
    console.log("Checking rg-finanzas...");
    const { data: biz, error: bError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', 'rg-finanzas')
        .single();
    
    if (bError) {
        console.error("Error fetching biz:", bError);
        return;
    }

    console.log("Business:", biz.nombre_negocio);
    console.log("Edit Token in DB:", biz.edit_token);
    
    // Check if gallery_images TABLE exists and has data
    const { data: gallery, error: gError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('card_id', biz.id);
    
    if (gError) {
        console.error("Error fetching gallery table:", gError.message);
    } else {
        console.log("Gallery table items:", gallery.length);
        gallery.forEach(img => {
            console.log(` - ID: ${img.id}, URL: ${img.image_url}, Sort: ${img.sort_order}`);
        });
    }

    // Check JSONB column too
    console.log("Gallery JSONB column length:", (biz.gallery_images || []).length);
}

check();
