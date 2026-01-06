import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSEOData } from '../../utils/seoData';

export default function SEOHead() {
  const location = useLocation();

  useEffect(() => {
    const seoData = getSEOData(location.pathname);
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://djibgo.com';

    // Update title
    document.title = seoData.title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update basic meta tags
    updateMetaTag('description', seoData.description);
    updateMetaTag('keywords', seoData.keywords);

    // Update Open Graph tags
    updateMetaTag('og:title', seoData.title, true);
    updateMetaTag('og:description', seoData.description, true);
    updateMetaTag('og:url', `${siteUrl}${seoData.canonical}`, true);
    if (seoData.ogImage) {
      updateMetaTag('og:image', seoData.ogImage, true);
    }

    // Update Twitter Card tags
    updateMetaTag('twitter:title', seoData.title);
    updateMetaTag('twitter:description', seoData.description);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${siteUrl}${seoData.canonical}`;

    // Update last-modified meta tag
    const today = new Date().toISOString().split('T')[0];
    updateMetaTag('last-modified', today);

    // Update or create JSON-LD schema
    if (seoData.schema) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]#page-schema');
      
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.id = 'page-schema';
        document.head.appendChild(schemaScript);
      }
      
      // Add url to schema if it doesn't exist
      const schemaWithUrl = { ...seoData.schema };
      if (!schemaWithUrl.url && schemaWithUrl['@type'] !== 'FAQPage') {
        schemaWithUrl.url = `${siteUrl}${seoData.canonical}`;
      }
      
      schemaScript.textContent = JSON.stringify(schemaWithUrl);
    }
  }, [location.pathname]);

  return null;
}