"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

export const ProductGallery = ({
  images,
  productName,
  className,
}: ProductGalleryProps) => {
  // Sort images by sort_order, primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = sortedImages[activeIndex];

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  if (sortedImages.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No image available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />

        {/* Zoom Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ZoomIn className="h-4 w-4" />
              <span className="sr-only">Zoom image</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={activeImage.url}
                alt={activeImage.alt_text || productName}
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Navigation Arrows (if multiple images) */}
        {sortedImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous image</span>
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next image</span>
            </Button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {activeIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border-2 transition-all",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                fill
                sizes="(max-width: 768px) 20vw, 100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
