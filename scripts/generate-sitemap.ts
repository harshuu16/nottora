import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES, MASTER_SUBJECTS } from '../src/data/academicData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://nottora.vercel.app';
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

async function fetchPublishedMaterialsIfConfigured(): Promise<Array<{ id: string; updatedAt: string }>> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_') || supabaseAnonKey.includes('YOUR_')) {
    return [];
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await client
      .from('materials')
      .select('id, updated_at, created_at')
      .eq('published', true)
      .limit(500);

    if (error || !data) {
      console.warn('[sitemap-generator] Supabase query notice:', error?.message || 'No data');
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      updatedAt: (item.updated_at || item.created_at || TODAY).split('T')[0],
    }));
  } catch (err) {
    console.warn('[sitemap-generator] Note: Supabase connection skipped during build:', (err as Error)?.message);
    return [];
  }
}

export async function generateSitemap(): Promise<void> {
  const urls: SitemapUrl[] = [];

  // 1. Canonical Homepage
  urls.push({
    loc: `${BASE_URL}/`,
    lastmod: TODAY,
    changefreq: 'daily',
    priority: '1.0',
  });

  // 2. Canonical Category Pages (only standard indexable categories)
  const validCategoryIds = ['notes', 'important-questions', 'pyqs', 'lab-manuals'];
  for (const cat of CATEGORIES) {
    if (validCategoryIds.includes(cat.id)) {
      urls.push({
        loc: `${BASE_URL}/category/${cat.id}`,
        lastmod: TODAY,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  }

  // 3. Canonical Master Subject Pages
  for (const subject of MASTER_SUBJECTS) {
    urls.push({
      loc: `${BASE_URL}/subject/${encodeURIComponent(subject.slug)}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  // 4. Safely query published materials (if Supabase configured)
  const publishedMaterials = await fetchPublishedMaterialsIfConfigured();
  for (const mat of publishedMaterials) {
    urls.push({
      loc: `${BASE_URL}/material/${encodeURIComponent(mat.id)}`,
      lastmod: mat.updatedAt,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  // Build XML String
  const xmlEntries = urls
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

  const targetPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(targetPath, sitemapXml, 'utf-8');
  console.log(`[sitemap-generator] Successfully wrote ${urls.length} URLs to ${targetPath}`);
}

generateSitemap().catch((err) => {
  console.error('[sitemap-generator] Error:', err);
  process.exit(1);
});
