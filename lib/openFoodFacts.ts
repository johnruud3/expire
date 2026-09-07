import type { AppLanguage } from '@/lib/types';

export type OffProduct = {
  name: string | null;
  imageUrl: string | null;
};

export function normalizeBarcode(value: string): string {
  return value.replace(/\s+/g, '');
}

export async function lookupOpenFoodFacts(
  barcode: string,
  language: AppLanguage
): Promise<OffProduct | null> {
  const clean = normalizeBarcode(barcode);
  if (!clean) return null;

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=product_name,product_name_en,product_name_nb,product_name_no,image_url,image_front_url,image_front_small_url`,
    {
      headers: {
        'User-Agent': 'Expire/1.0 (https://github.com/johnruud3/expire)',
      },
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    status?: number;
    product?: {
      product_name?: string;
      product_name_en?: string;
      product_name_nb?: string;
      product_name_no?: string;
      image_url?: string;
      image_front_url?: string;
      image_front_small_url?: string;
    };
  };

  if (data.status !== 1 || !data.product) return null;

  const product = data.product;
  const name =
    (language === 'nb'
      ? product.product_name_nb || product.product_name_no
      : product.product_name_en) ||
    product.product_name ||
    null;
  const imageUrl =
    product.image_front_url || product.image_url || product.image_front_small_url || null;

  if (!name && !imageUrl) return null;
  return { name, imageUrl };
}
