import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, 'apps/worker/.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: creator } = await supabase
    .from('creators')
    .select('id, slug')
    .eq('slug', 'arnav8452-znjnr')
    .single();

  if (!creator) {
    console.log("Creator not found");
    return;
  }

  const { data: identity } = await supabase
    .from('creator_identities')
    .select('raw_model_output')
    .eq('creator_id', creator.id)
    .single();

  console.log("=== ACHIEVEMENTS ===");
  console.log(JSON.stringify(identity?.raw_model_output?.achievements, null, 2));

  const { data: metrics } = await supabase
    .from('platform_metrics')
    .select('platform')
    .eq('creator_id', creator.id);

  console.log("\n=== PLATFORM DOSSIERS ===");
  console.log(JSON.stringify(metrics, null, 2));
}

check().catch(console.error);
