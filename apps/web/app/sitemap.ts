import { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: creators } = await getSupabaseAdmin()
    .from('creators')
    .select('slug, updated_at')
    .eq('onboarding_status', 'live');

  const liveCreators = creators || [];

  return liveCreators.map((creator) => ({
    url: `https://closr.to/p/${creator.slug}`,
    lastModified: new Date(creator.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }));
}
