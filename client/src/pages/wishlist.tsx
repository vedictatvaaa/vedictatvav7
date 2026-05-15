import { Link } from "wouter";
import { Heart, Trash2, ShoppingCart, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { getProductUrl } from "@/lib/utils";
import type { Product } from "@shared/schema";

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  function handleAddToCart(product: Product) {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  }

  function handleMoveAllToCart() {
    items.forEach((p) => addToCart(p));
    const count = items.length;
    clearWishlist();
    toast({
      title: `${count} ${count === 1 ? "item" : "items"} moved to cart`,
      description: "Your wishlist has been cleared. Head to checkout when ready.",
    });
  }

  function handleRemove(product: Product) {
    removeFromWishlist(product.id);
    toast({
      title: "Removed from Wishlist",
      description: `${product.name} has been removed from your wishlist.`,
    });
  }

  function handleClearAll() {
    clearWishlist();
    toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
    });
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-7 w-7 text-[#6D2B35]/50" strokeWidth={1.6} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#6D2B35] mb-3 font-semibold tracking-tight" data-testid="text-empty-wishlist">
            Your Wishlist is Empty
          </h1>
          <p className="text-sm text-[#5a4a3a]/70 mb-6 leading-relaxed">
            Save your favorite spiritual products here for later. Explore our collection and add items you love.
          </p>
          <Link href="/spiritual-essentials">
            <Button className="rounded-md bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] h-10 px-5 text-[13px] font-semibold" data-testid="btn-shop-now">
              Start Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Slim hero */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-8 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3" /> Saved For Later
            </span>
            <span className="h-px w-8 bg-[#D4AF37]/60" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white text-center font-semibold tracking-tight" data-testid="text-wishlist-title">My Wishlist</h1>
          <p className="text-white/70 mt-1 text-sm text-center" data-testid="text-wishlist-count">
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/spiritual-essentials">
            <Button variant="ghost" className="text-[#6D2B35] hover:text-[#D4AF37] text-[13px] font-semibold rounded-md h-10" data-testid="btn-continue-shopping">
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-md h-10 text-[13px] bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-semibold"
              onClick={handleMoveAllToCart}
              data-testid="btn-move-all-to-cart"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Move all to cart ({items.length})
            </Button>
            <Button
              variant="outline"
              className="rounded-md h-10 text-[13px] text-rose-700 border-rose-200 hover:bg-rose-50 font-semibold"
              onClick={handleClearAll}
              data-testid="btn-clear-wishlist"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((product) => (
            <div key={product.id} className="overflow-hidden bg-white border border-[#D4AF37]/25 rounded-md hover:border-[#D4AF37]/55 transition-colors group" data-testid={`card-wishlist-${product.id}`}>
              <Link href={getProductUrl(product.id, product.name)}>
                <div className="aspect-square overflow-hidden bg-[#FBF7EE] cursor-pointer border-b border-[#D4AF37]/15">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    data-testid={`img-wishlist-product-${product.id}`}
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link href={getProductUrl(product.id, product.name)}>
                  <h3 className="font-serif text-base text-[#6D2B35] line-clamp-1 hover:text-[#D4AF37] transition-colors cursor-pointer font-semibold" data-testid={`text-wishlist-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                </Link>
                <p className="text-[#5a4a3a]/60 text-xs mt-1" data-testid={`text-wishlist-product-category-${product.id}`}>
                  {product.category}
                </p>
                <p className="font-bold text-base text-[#6D2B35] mt-2" data-testid={`text-wishlist-product-price-${product.id}`}>
                  ₹{product.price.toLocaleString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    className="flex-1 bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md text-[13px] font-semibold h-9"
                    onClick={() => handleAddToCart(product)}
                    data-testid={`btn-add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md h-9 w-9 text-[#5a4a3a]/60 border-[#D4AF37]/30 hover:text-rose-700 hover:border-rose-200 flex-shrink-0"
                    onClick={() => handleRemove(product)}
                    data-testid={`btn-remove-wishlist-${product.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
