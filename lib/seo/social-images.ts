export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
} as const;

export const TWITTER_IMAGE = {
  url: "/twitter-image",
  width: 1200,
  height: 600,
} as const;

export const DEFAULT_SOCIAL_IMAGE_ALT = "Calculaderia - Calculadora financeira online grátis";
export const SOCIAL_IMAGE_CONTENT_TYPE = "image/png";

export function getOpenGraphImages(alt: string = DEFAULT_SOCIAL_IMAGE_ALT) {
  return [{ ...OG_IMAGE, alt }];
}

export function getTwitterImages(alt: string = DEFAULT_SOCIAL_IMAGE_ALT) {
  return [{ ...TWITTER_IMAGE, alt }];
}
