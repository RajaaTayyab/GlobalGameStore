import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Zap, Truck, ChevronRight } from "lucide-react";
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

  const perks = [
    { icon: Zap, text: "Instant code delivery" },
    { icon: ShieldCheck, text: "Safe & secure payment" },
    { icon: Truck, text: "Money back guarantee" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-cyan-400">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-cyan-400">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-300">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={800}
              height={800}
              priority
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-8xl">
              🎮
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {product.category?.name ?? "Digital Product"}
            {product.region ? ` · ${product.region.name}` : ""}
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white sm:text-4xl">
            {product.name}
            {!!product.sold_out && (
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
                Sold Out
              </span>
            )}
          </h1>
          {product.description && (
            <p className="mt-4 leading-relaxed text-slate-400">{product.description}</p>
          )}

          <div className="mt-6 space-y-2">
            {perks.map((p) => (
              <p key={p.text} className="flex items-center gap-2 text-sm text-slate-300">
                <p.icon className="h-4 w-4 text-emerald-400" /> {p.text}
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
