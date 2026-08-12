import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck, Wallet, MessageCircle, ChevronRight, Gamepad2 } from "lucide-react";
import { getProductBySlug, getAvailableCodeCounts } from "@/lib/products";
import ProductBuy from "@/components/ProductBuy";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);
  return { title: product?.name ?? "Product", description: product?.description ?? undefined };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { product, variants } = await getProductBySlug(slug);

  if (!product) notFound();

  const stock = await getAvailableCodeCounts(variants.map((v) => v.id));
  const totalStock = Object.values(stock).reduce((sum, n) => sum + n, 0);

  const perks = [
    {
      icon: PackageCheck,
      text:
        totalStock > 0
          ? `${totalStock} code${totalStock === 1 ? "" : "s"} in stock, ready to send`
          : "Restocking — check back shortly",
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
        <span className="line-clamp-1 text-text-primary">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image — object-contain in a fixed-height frame so every product's
            art fits fully regardless of its native aspect ratio. object-cover
            + aspect-square was cropping wide banners like Xbox's gift card
            art (641×403) mid-word. */}
        <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface p-6 sm:h-[480px]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={800}
              height={800}
              priority
              className="h-full w-full object-contain"
            />
          ) : (
            <Gamepad2 className="h-24 w-24 text-border" />
          )}
        </div>

        {/* Info */}
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-chrome">
            {product.category?.name ?? "Digital Product"}
            {product.region ? ` · ${product.region.name}` : ""}
          </p>
          <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl font-bold text-text-primary sm:text-4xl">
            {product.name}
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
            productName={product.name}
            productImage={product.image_url}
            soldOut={!!product.sold_out}
            variants={variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: Number(v.price),
              originalPrice: v.original_price ? Number(v.original_price) : null,
              stock: stock[v.id] ?? 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}