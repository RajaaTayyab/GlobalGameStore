export interface ProductFamily {
  canonicalSlug: string;
  displayName: string;
  memberSlugs: string[];
}

// Country editions share one storefront tile. Their variants and inventory
// remain separate, so existing codes, carts, and order history stay intact.
export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    canonicalSlug: "psn",
    displayName: "PlayStation Gift Card",
    memberSlugs: ["psn", "psn-ksa", "psn-uae", "psn-kuwait"],
  },
  {
    canonicalSlug: "xbox",
    displayName: "Xbox Gift Card",
    memberSlugs: ["xbox", "xbox-ksa"],
  },
  {
    canonicalSlug: "amazon-ksa",
    displayName: "Amazon Gift Card",
    memberSlugs: ["amazon-ksa", "amazon-uae"],
  },
  {
    canonicalSlug: "netflix-ksa",
    displayName: "Netflix Gift Card",
    memberSlugs: ["netflix-ksa", "netflix-uae"],
  },
  {
    canonicalSlug: "noon-sa",
    displayName: "Noon Gift Card",
    memberSlugs: ["noon-sa", "noon-ae"],
  },
];

export function getProductFamily(slug: string): ProductFamily | undefined {
  return PRODUCT_FAMILIES.find((family) => family.memberSlugs.includes(slug));
}

export function isHiddenFamilyMember(slug: string): boolean {
  const family = getProductFamily(slug);
  return !!family && family.canonicalSlug !== slug;
}
