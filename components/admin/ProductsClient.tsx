"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AddProductDialog } from "./AddProductDialog";

export function AddProductButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
        Add Product
      </button>
      <AddProductDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
