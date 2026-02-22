"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  onRemove?: (url: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  multiple = false,
  maxFiles = 5,
  disabled = false,
  className,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max files limit
    if (multiple && images.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 5MB`);
          continue;
        }

        // Convert to base64 or upload to cloud storage
        // For now, using base64 for temporary preview
        const reader = new FileReader();
        const url = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === "string") {
              resolve(result);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        if (multiple) {
          onChange([...images, ...uploadedUrls]);
        } else {
          onChange(uploadedUrls[0]);
        }
        toast.success(
          `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (url: string) => {
    if (multiple) {
      const filtered = images.filter((img) => img !== url);
      onChange(filtered);
    } else {
      onChange("");
    }

    if (onRemove) {
      onRemove(url);
    }

    toast.success("Image removed");
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-auto",
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Preview Grid */}
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            multiple
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border-2 border-gray-200",
                  aspectClasses[aspectRatio]
                )}
              >
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>

              {/* Remove Button */}
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Primary Badge for first image */}
              {multiple && index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {(!multiple || images.length < maxFiles) && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled || uploading}
          className={cn(
            "w-full h-32 border-2 border-dashed",
            !images.length && "h-48"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-500">
                {images.length > 0 ? "Add more images" : "Upload image"}
              </div>
              {multiple && (
                <div className="text-xs text-gray-400">
                  {images.length}/{maxFiles} uploaded
                </div>
              )}
            </div>
          )}
        </Button>
      )}

      <p className="text-xs text-gray-500">
        Accepted formats: JPG, PNG, GIF. Max size: 5MB
        {multiple && ` (up to ${maxFiles} images)`}
      </p>
    </div>
  );
}
