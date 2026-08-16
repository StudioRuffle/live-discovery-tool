"use client";

import { useRef, useState } from "react";
import {
  removeImage,
  reorderImage,
  uploadImages,
} from "@/app/facilitator/actions";
import { resizeImageForUpload } from "@/lib/resize-image";
import type { ImageItem } from "@/lib/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RAW_FILE_SIZE = 15 * 1024 * 1024; // pre-resize guard, well under a phone photo

export function ImageManager({
  exerciseId,
  images,
}: {
  exerciseId: string;
  images: ImageItem[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...images].sort((a, b) => a.order - b.order);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList);
    const rejected = files.filter(
      (f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_RAW_FILE_SIZE
    );
    if (rejected.length > 0) {
      setError(
        `Skipped ${rejected.length} file(s) — only JPG/PNG/WebP under 15MB are allowed.`
      );
    }
    const accepted = files.filter((f) => !rejected.includes(f));
    if (accepted.length === 0) return;

    setUploading(true);
    try {
      const resized = await Promise.all(accepted.map(resizeImageForUpload));
      const formData = new FormData();
      formData.set("exercise_id", exerciseId);
      resized.forEach((file) => formData.append("images", file));
      await uploadImages(formData);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove(imageId: string) {
    setBusyImageId(imageId);
    const formData = new FormData();
    formData.set("exercise_id", exerciseId);
    formData.set("image_id", imageId);
    try {
      await removeImage(formData);
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleReorder(imageId: string, direction: -1 | 1) {
    setBusyImageId(imageId);
    const formData = new FormData();
    formData.set("exercise_id", exerciseId);
    formData.set("image_id", imageId);
    formData.set("direction", String(direction));
    try {
      await reorderImage(formData);
    } finally {
      setBusyImageId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center ${
          dragOver ? "border-black bg-gray-50" : "border-gray-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <p className="text-sm text-gray-500">
          {uploading ? "Uploading…" : "Drag images here, or click to choose files"}
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {sorted.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sorted.map((img, i) => (
            <li key={img.id} className="flex flex-col gap-1 rounded border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="aspect-square w-full rounded object-cover"
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  disabled={i === 0 || busyImageId === img.id}
                  onClick={() => handleReorder(img.id, -1)}
                  className="disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={busyImageId === img.id}
                  onClick={() => handleRemove(img.id)}
                  className="text-red-600 disabled:opacity-30"
                >
                  Remove
                </button>
                <button
                  type="button"
                  disabled={i === sorted.length - 1 || busyImageId === img.id}
                  onClick={() => handleReorder(img.id, 1)}
                  className="disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
