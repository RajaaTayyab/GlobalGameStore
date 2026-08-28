import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck, Wallet, MessageCircle, ChevronRight, Gamepad2 } from "lucide-react";
import { getProductBySlug, getAvailableCodeCounts } from "@/lib/products";
import { getWhatsappNumber } from "@/lib/settings";
import ProductBuy from "@/components/ProductBuy";
import { getProductFamily } from "@/lib/product-families";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);
  return { title: getProductFamily(slug)?.displayName ?? product?.name ?? "Product", description: product?.description ?? undefined };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { product, variants } = await getProductBySlug(slug);

  if (!product) notFound();

  const family = getProductFamily(slug);
  const productName = family?.displayName ?? product.name;

  const stock = await getAvailableCodeCounts(variants.map((v) => v.id));
  const totalStock = Object.values(stock).reduce((sum, n) => sum + n, 0);
  const whatsappPhone = await getWhatsappNumber();

  const perks = [
    {
      icon: PackageCheck,
      text:
        totalStock > 0
          ? `${totalStock} code${totalStock === 1 ? "" : "s"} in stock, ready to send`
          : "Restocking check back shortly",
    },
    { icon: Wallet, text: "Store credit for one-click checkout" },
    { icon: MessageCircle, text: "Or order the whole cart on WhatsApp" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-1.5 font-mono text-sm text-text-muted">
        <Link href="/" className="transition-colors hover:text-accent-chrome">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition-colors hover:text-accent-chrome">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-text-primary">{productName}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image icon chip inside a fixed-height frame. object-contain
            stops cropping (fixed the Xbox mid-word crop bug); the white chip
            underneath keeps every source background (white/black/brand
            color) from clashing raw against the dark surface. */}
        <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface p-8 sm:h-[480px]">
          {product.image_url ? (
            <div className="relative h-full w-full rounded-2xl bg-white p-6 shadow-xl">
              <Image
                src={product.image_url}
                alt={productName}
                fill
                priority
                className="object-contain p-6"
              />
            </div>
          ) : (
            <Gamepad2 className="h-24 w-24 text-border" />
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="flex items-center gap-3 font-serif text-3xl font-bold text-text-primary sm:text-4xl">
            {productName}
            {!!product.sold_out && (
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
                Sold Out
              </span>
            )}
          </h1>
          {product.description && (
            <p className="mt-4 leading-relaxed text-text-muted">{product.description}</p>
          )}

          <div className="mt-6 space-y-2">
            {perks.map((p, i) => (
              <p key={p.text} className="flex items-center gap-2 text-sm text-text-muted">
                <p.icon
                  className={`h-4 w-4 ${i === 0 && totalStock === 0 ? "text-old-price" : "text-instock"}`}
                />
                {p.text}
              </p>
            ))}
          </div>

          <ProductBuy
            productId={product.id}
            productSlug={product.slug}
            productName={productName}
            productImage={product.image_url}
            soldOut={!!product.sold_out}
            whatsappPhone={whatsappPhone}
            variants={variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: Number(v.price),
              originalPrice: v.original_price ? Number(v.original_price) : null,
              stock: stock[v.id] ?? 0,
              soldOut: !!v.sold_out,
              priceOnRequest: !!v.price_on_request,
              region: v.region ?? null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
