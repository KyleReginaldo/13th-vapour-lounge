/**
 * ImageUpload Component Usage Examples
 *
 * This file demonstrates how to use the ImageUpload component
 * in different scenarios across the application.
 */

import { ImageUpload } from "@/components/shared/ImageUpload";
import { useState } from "react";

// Example 1: Single Profile Picture Upload
export function ProfileImageUploadExample() {
  const [profileImage, setProfileImage] = useState<string>("");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Profile Picture</label>
      <ImageUpload
        value={profileImage}
        onChange={(url) =>
          setProfileImage(typeof url === "string" ? url : url[0])
        }
        multiple={false}
        aspectRatio="square"
      />
    </div>
  );
}

// Example 2: Multiple Product Images Upload
export function ProductImagesUploadExample() {
  const [productImages, setProductImages] = useState<string[]>([]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Product Images</label>
      <ImageUpload
        value={productImages}
        onChange={(urls) =>
          setProductImages(Array.isArray(urls) ? urls : [urls])
        }
        multiple={true}
        maxFiles={5}
        aspectRatio="square"
      />
    </div>
  );
}

// Example 3: Category/Brand Logo Upload
export function LogoUploadExample() {
  const [logoImage, setLogoImage] = useState<string>("");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Brand Logo</label>
      <ImageUpload
        value={logoImage}
        onChange={(url) => setLogoImage(typeof url === "string" ? url : url[0])}
        multiple={false}
        aspectRatio="auto"
      />
    </div>
  );
}

// Example 4: Payment Proof Upload (Single Image)
export function PaymentProofUploadExample() {
  const [paymentProof, setPaymentProof] = useState<string>("");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Payment Proof</label>
      <ImageUpload
        value={paymentProof}
        onChange={(url) =>
          setPaymentProof(typeof url === "string" ? url : url[0])
        }
        multiple={false}
        aspectRatio="video"
      />
      <p className="text-xs text-gray-500">
        Upload a screenshot of your payment receipt
      </p>
    </div>
  );
}

// Example 5: With Form Integration
export function FormWithImageUploadExample() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    images: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate images
    if (formData.images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    // Submit form data
    console.log("Submitting:", formData);

    // TODO: Send to server action
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Images</label>
        <ImageUpload
          value={formData.images}
          onChange={(urls) =>
            setFormData({
              ...formData,
              images: Array.isArray(urls) ? urls : [urls],
            })
          }
          multiple
          maxFiles={5}
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
}
