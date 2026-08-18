import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { Upload, Check, X } from "lucide-react";
import Image from "next/image";

export default function ImageCropper({ onCropCompleteCallback, currentImageUrl }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || "");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(currentImageUrl || "");
  }, [currentImageUrl]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropping(true);
    }
  };

  const handleCropImage = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      setPreview(croppedImageBase64);
      setIsCropping(false);
      if (onCropCompleteCallback) {
        onCropCompleteCallback(croppedImageBase64);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setIsCropping(false);
    setImageSrc(null);
  };

  return (
    <div className="space-y-4">
      {/* If cropping is active, show the cropper full-width */}
      {isCropping ? (
        <div className="relative w-full h-[400px] bg-zinc-900 rounded-lg overflow-hidden border border-neon-purple/50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={21 / 9} // Standard banner aspect ratio
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 px-6 py-3 rounded-full backdrop-blur-md">
            <span className="text-xs font-bold text-gray-300">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-24 accent-neon-purple"
            />
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/40 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleCropImage}
              className="p-2 bg-green-500/20 text-green-500 hover:bg-green-500/40 rounded-full transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {preview ? (
            <div className="relative w-full sm:w-80 h-36 rounded-lg overflow-hidden border border-white/10 group bg-neutral-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Banner Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                <label className="cursor-pointer px-3 py-2 bg-neutral-900 border border-white/20 rounded-lg text-xs font-bold text-white hover:border-amber-500 hover:text-amber-400 transition-all">
                  Change Media
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPreview("");
                    if (onCropCompleteCallback) onCropCompleteCallback("");
                  }}
                  className="px-3 py-2 bg-rose-950/80 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold hover:bg-rose-900 transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="w-full sm:w-80 h-36 flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-lg bg-neutral-950 hover:bg-neutral-900 transition-all cursor-pointer text-gray-400 hover:border-amber-500/50 hover:text-amber-400 group">
              <Upload className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider">Upload Custom Media</span>
              <span className="text-[10px] text-gray-500 font-mono mt-0.5">PNG, JPG, WebP (Interactive Crop)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), false);
    reader.readAsDataURL(file);
  });
}
