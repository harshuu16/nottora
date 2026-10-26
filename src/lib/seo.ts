import { useEffect } from 'react';
import { Material, MaterialCategory, Subject, ViewMode } from '../types';
import { getCanonicalSubject } from '../data/academicData';

const SITE_ORIGIN = 'https://nottora.vercel.app';
const DEFAULT_BRAND_TITLE = 'Nottora — Your Notes. Organized for Study.';
const DEFAULT_DESCRIPTION =
  'Digital academic library and study repository for college students to discover, organize, and study notes, important questions, PYQs, and lab manuals.';

interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, any>;
}

function updateMetaTag(selector: string, attr: string, value: string, createFn: () => HTMLElement) {
  let el = document.querySelector(selector);
  if (!el) {
    el = createFn();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function updateLinkTag(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function updateJsonLd(jsonLd?: Record<string, any>) {
  const SCRIPT_ID = 'seo-structured-data';
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!jsonLd) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}

export function applySeoMetadata(config: SeoConfig): void {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  document.title = config.title;

  // 2. Meta Description
  updateMetaTag('meta[name="description"]', 'content', config.description, () => {
    const meta = document.createElement('meta');
    meta.name = 'description';
    return meta;
  });

  // 3. Canonical Link
  updateLinkTag('canonical', config.canonicalUrl);

  // 4. OpenGraph Tags
  updateMetaTag('meta[property="og:title"]', 'content', config.title, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:title');
    return meta;
  });
  updateMetaTag('meta[property="og:description"]', 'content', config.description, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:description');
    return meta;
  });
  updateMetaTag('meta[property="og:url"]', 'content', config.canonicalUrl, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:url');
    return meta;
  });
  updateMetaTag('meta[property="og:type"]', 'content', config.ogType || 'website', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:type');
    return meta;
  });
  updateMetaTag('meta[property="og:site_name"]', 'content', 'Nottora', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:site_name');
    return meta;
  });

  // 5. Twitter Card Tags
  updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image', () => {
    const meta = document.createElement('meta');
    meta.name = 'twitter:card';
    return meta;
  });
  updateMetaTag('meta[name="twitter:title"]', 'content', config.title, () => {
    const meta = document.createElement('meta');
    meta.name = 'twitter:title';
    return meta;
  });
  updateMetaTag('meta[name="twitter:description"]', 'content', config.description, () => {
    const meta = document.createElement('meta');
    meta.name = 'twitter:description';
    return meta;
  });

  // 6. Schema.org JSON-LD Structured Data
  updateJsonLd(config.jsonLd);
}

const CATEGORY_NAMES: Record<MaterialCategory, { title: string; desc: string }> = {
  notes: {
    title: 'Lecture Notes Archive',
    desc: 'Access curated unit-wise lecture notes, handwritten summaries, and faculty theory guides on Nottora.',
  },
  'important-questions': {
    title: 'Important & High-Yield Questions',
    desc: 'Practice frequently repeated semester exam questions, 10-mark guarantee topics, and mid-term banks on Nottora.',
  },
  pyqs: {
    title: 'Previous Year Question Papers (PYQs)',
    desc: 'Download authentic semester university question papers from 2020-2024 with marked keys on Nottora.',
  },
  'lab-manuals': {
    title: 'Laboratory Manuals & Viva Compendium',
    desc: 'Official laboratory manuals, experiment procedures, circuit schematics, and viva voce guides on Nottora.',
  },
  other: {
    title: 'Reference & Formula Cheatsheets',
    desc: 'University syllabus copies, engineering formula handbooks, and reference charts on Nottora.',
  },
};

/**
 * Calculates page-specific SEO metadata based on current router state and active material.
 */
export function getSeoConfigForRoute(
  view: ViewMode,
  subjects: Subject[],
  activeMaterial?: Material | null
): SeoConfig {
  // 1. Material Active Detail View
  if (activeMaterial) {
    const categoryLabel = CATEGORY_NAMES[activeMaterial.category]?.title || activeMaterial.category;
    const title = `${activeMaterial.title} — ${activeMaterial.subjectName} | Nottora`;
    const description = `${activeMaterial.title} for ${activeMaterial.subjectName} (${categoryLabel}). ${
      activeMaterial.description || activeMaterial.topic || 'Verified academic study document.'
    }`.slice(0, 160);
    const canonicalUrl = `${SITE_ORIGIN}/material/${encodeURIComponent(activeMaterial.id)}`;

    return {
      title,
      description,
      canonicalUrl,
      ogType: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: activeMaterial.title,
        description: activeMaterial.description,
        educationalLevel: 'Undergraduate B.Tech',
        learningResourceType: categoryLabel,
        inLanguage: 'en',
        url: canonicalUrl,
        publisher: {
          '@type': 'EducationalOrganization',
          name: 'Nottora',
          url: SITE_ORIGIN,
        },
      },
    };
  }

  // 2. Subject View
  if (view.type === 'subject') {
    const sub = subjects.find(
      (s) => s.id === view.subjectId || s.slug === view.subjectId || s.code === view.subjectId
    ) || getCanonicalSubject(view.subjectId);
    const subjectName = sub?.name || 'Academic Subject';
    const subjectSlug = sub?.slug || view.subjectId;
    const category = view.initialCategory;

    if (category && category !== ('all' as any)) {
      const catInfo = CATEGORY_NAMES[category];
      const title = `${catInfo?.title || category} — ${subjectName} | Nottora`;
      const description = `Download ${catInfo?.title || category} for ${subjectName}. Unit-wise curriculum materials, exam guides, and verified study papers on Nottora.`.slice(0, 160);
      const canonicalUrl = `${SITE_ORIGIN}/subject/${encodeURIComponent(subjectSlug)}/${encodeURIComponent(category)}`;

      return {
        title,
        description,
        canonicalUrl,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: canonicalUrl,
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
              { '@type': 'ListItem', position: 2, name: subjectName, item: `${SITE_ORIGIN}/subject/${encodeURIComponent(subjectSlug)}` },
              { '@type': 'ListItem', position: 3, name: catInfo?.title || category, item: canonicalUrl },
            ],
          },
        },
      };
    }

    const title = `${subjectName} Notes, PYQs & Study Material — Nottora`;
    const description = `Comprehensive syllabus study resources for ${subjectName}${
      sub?.code ? ` (${sub.code})` : ''
    }. Access lecture notes, previous year questions, important topics, and lab manuals on Nottora.`.slice(0, 160);
    const canonicalUrl = `${SITE_ORIGIN}/subject/${encodeURIComponent(subjectSlug)}`;

    return {
      title,
      description,
      canonicalUrl,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: subjectName,
        courseCode: sub?.code || undefined,
        description,
        provider: {
          '@type': 'EducationalOrganization',
          name: 'Nottora',
          url: SITE_ORIGIN,
        },
        url: canonicalUrl,
      },
    };
  }

  // 3. Category View
  if (view.type === 'category') {
    const catInfo = CATEGORY_NAMES[view.category] || CATEGORY_NAMES.notes;
    const title = `${catInfo.title} — Nottora`;
    const description = `${catInfo.desc} Curated by university syllabus units with instant downloads on Nottora.`.slice(0, 160);
    const canonicalUrl = `${SITE_ORIGIN}/category/${encodeURIComponent(view.category)}`;

    return {
      title,
      description,
      canonicalUrl,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: canonicalUrl,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
            { '@type': 'ListItem', position: 2, name: catInfo.title, item: canonicalUrl },
          ],
        },
      },
    };
  }

  // 4. Default: Homepage
  return {
    title: DEFAULT_BRAND_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: `${SITE_ORIGIN}/`,
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Nottora',
      url: SITE_ORIGIN,
      description: DEFAULT_DESCRIPTION,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  };
}

/**
 * Hook to automatically synchronize document title, meta tags, and structured data on navigation.
 */
export function useSeoMetadata(
  view: ViewMode,
  subjects: Subject[],
  activeMaterial?: Material | null
): void {
  useEffect(() => {
    const config = getSeoConfigForRoute(view, subjects, activeMaterial);
    applySeoMetadata(config);
  }, [view, subjects, activeMaterial]);
}
