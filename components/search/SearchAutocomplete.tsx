"use client";

import { autocompleteProducts } from "@/app/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconInput } from "@/components/ui/icon-input";
import { cn, formatCurrency } from "@/lib/utils";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchSuggestion {
  id: string;
  type: "product" | "category";
  name: string;
  slug: string;
  image?: string;
  price?: number;
}

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchAutocomplete = ({
  onSearch,
  placeholder = "Search for products...",
  className,
}: SearchAutocompleteProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await autocompleteProducts(query);

        if (result.success && result.data) {
          const products = result.data as any[];
          const suggestions: SearchSuggestion[] = products.map((p: any) => ({
            id: p.id,
            type: "product" as const,
            name: p.name,
            slug: p.slug,
            image: p.product_images?.[0]?.url || undefined,
          }));

          setSuggestions(suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    saveRecentSearch(searchQuery);
    setIsOpen(false);
    setQuery("");

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const showDropdown = isOpen && (query.trim() || recentSearches.length > 0);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <IconInput
          ref={inputRef}
          icon={Search}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <Card
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto shadow-lg"
        >
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="border-b p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Recent Searches</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRecent}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search);
                      handleSearch(search);
                    }}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-muted"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {query && (
            <div className="p-4">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={
                        suggestion.type === "product"
                          ? `/products/${suggestion.slug}`
                          : `/products?category=${suggestion.slug}`
                      }
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      {suggestion.type === "product" ? (
                        <>
                          {suggestion.image && (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={suggestion.image}
                                alt={suggestion.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">
                              {suggestion.name}
                            </p>
                            {suggestion.price && (
                              <p className="text-sm text-primary">
                                {formatCurrency(suggestion.price)}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{suggestion.name}</span>
                          <Badge variant="secondary" className="ml-auto">
                            Category
                          </Badge>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}

          {/* Search All Button */}
          {query && (
            <div className="border-t p-3">
              <Button
                onClick={() => handleSearch(query)}
                variant="ghost"
                className="w-full justify-start"
              >
                <Search className="mr-2 h-4 w-4" />
                Search for &quot;{query}&quot;
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
