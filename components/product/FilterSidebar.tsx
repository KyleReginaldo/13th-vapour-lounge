"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface FilterOptions {
  categoryIds?: string[];
  brandIds?: string[];
  priceRange?: [number, number];
  inStockOnly?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  priceRange?: [number, number]; // Min and max price in the dataset
  className?: string;
  isMobile?: boolean;
}

const FilterContent = ({
  categories,
  brands,
  filters,
  onFiltersChange,
  priceRange = [0, 1000],
}: Omit<FilterSidebarProps, "className" | "isMobile">) => {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    filters.priceRange || priceRange
  );

  // Sync local price range when filters change externally
  useEffect(() => {
    if (filters.priceRange) {
      setLocalPriceRange(filters.priceRange);
    }
  }, [filters.priceRange]);

  const handleCategoryToggle = (categoryId: string) => {
    const current = filters.categoryIds || [];
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    onFiltersChange({ ...filters, categoryIds: updated });
  };

  const handleBrandToggle = (brandId: string) => {
    const current = filters.brandIds || [];
    const updated = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId];
    onFiltersChange({ ...filters, brandIds: updated });
  };

  const handlePriceRangeChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]]);
  };

  const handlePriceRangeCommit = () => {
    onFiltersChange({ ...filters, priceRange: localPriceRange });
  };

  const handleInStockToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, inStockOnly: checked });
  };

  const handleClearAll = () => {
    setLocalPriceRange(priceRange);
    onFiltersChange({
      categoryIds: [],
      brandIds: [],
      priceRange: undefined,
      inStockOnly: false,
    });
  };

  const hasActiveFilters =
    (filters.categoryIds && filters.categoryIds.length > 0) ||
    (filters.brandIds && filters.brandIds.length > 0) ||
    filters.priceRange ||
    filters.inStockOnly;

  return (
    <div className="space-y-6">
      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}

      <Accordion
        type="multiple"
        defaultValue={["category", "brand", "price", "stock"]}
      >
        {/* Categories */}
        {categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="text-sm font-semibold">
              Categories
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={!!filters.categoryIds?.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brands */}
        {brands.length > 0 && (
          <AccordionItem value="brand">
            <AccordionTrigger className="text-sm font-semibold">
              Brands
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={!!filters.brandIds?.includes(brand.id)}
                      onCheckedChange={() => handleBrandToggle(brand.id)}
                    />
                    <Label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {brand.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={priceRange[0]}
                max={priceRange[1]}
                step={10}
                value={localPriceRange}
                onValueChange={handlePriceRangeChange}
                onValueCommit={handlePriceRangeCommit}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  ₱ {localPriceRange[0].toFixed(0)}
                </span>
                <span className="text-muted-foreground">
                  ₱ {localPriceRange[1].toFixed(0)}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Stock Availability */}
        <AccordionItem value="stock">
          <AccordionTrigger className="text-sm font-semibold">
            Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={!!filters.inStockOnly}
                onCheckedChange={(checked) =>
                  handleInStockToggle(checked === true)
                }
              />
              <Label
                htmlFor="in-stock"
                className="text-sm font-normal cursor-pointer"
              >
                In Stock Only
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// Desktop Sidebar
export const FilterSidebar = (props: FilterSidebarProps) => {
  const { className, isMobile = false, ...rest } = props;

  if (isMobile) {
    return <FilterDrawer {...props} />;
  }

  return (
    <aside className={cn("w-64 shrink-0", className)}>
      <div className="sticky top-24 space-y-4">
        <h2 className="text-lg font-bold">Filters</h2>
        <FilterContent {...rest} />
      </div>
    </aside>
  );
};

// Mobile Drawer
export const FilterDrawer = ({
  categories,
  brands,
  filters,
  onFiltersChange,
  priceRange,
}: FilterSidebarProps) => {
  const [open, setOpen] = useState(false);

  const activeFiltersCount =
    (filters.categoryIds?.length || 0) +
    (filters.brandIds?.length || 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent
            categories={categories}
            brands={brands}
            filters={filters}
            onFiltersChange={onFiltersChange}
            priceRange={priceRange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
