import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeletes() {
  const { data: creators, error } = await supabase.from('creators').select('*').limit(5);
  if (error) {
    console.error('Error fetching creators:', error);
    return;
  }
  
  console.log('Creators:', creators);

  if (creators && creators.length > 0) {
    const creatorToTest = creators[0];
    console.log(`Attempting to delete creator ${creatorToTest.id}...`);
    
    // Simulate deleteCreatorProfile
    const { data: existing, error: findError } = await supabase
      .from("creators")
      .select("id")
      .eq("id", creatorToTest.id)
      .eq("owner_user_id", creatorToTest.owner_user_id)
      .single();

    if (findError || !existing) {
      console.log('Find error:', findError);
      return;
    }
    
    console.log('Found creator successfully, now deleting...');
    const { error: deleteError } = await supabase
      .from("creators")
      .delete()
      .eq("id", creatorToTest.id);
      
    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log('Delete successful!');
    }
  } else {
    console.log('No creators found to test.');
  }
}

checkDeletes();
