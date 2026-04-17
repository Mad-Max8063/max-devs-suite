import { createClient } from '@supabase/supabase-js';

const URL = 'https://bfsttdiokdqyvwjuvcbp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w';

const supabase = createClient(URL, KEY);

async function testAdd() {
    const cardId = 'be19140c-3aab-4f8a-8772-af28b6236e30';
    const token = 'jq56wdeb7qm14ek1bzp0c7';
    
    console.log("Testing add_gallery_image_secure...");
    const { data, error } = await supabase.rpc('add_gallery_image_secure', {
        p_card_id: cardId,
        p_edit_token: token,
        p_image_url: 'https://example.com/test.jpg',
        p_caption: 'Test',
        p_sort_order: 0
    });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Success:", data);
    }
}

testAdd();
