"use client";

import { useState } from "react";

import { joinApiPath } from "@/lib/env";

type CoverImageProps = {
  src?: string;
  alt: string;
  label?: string;
  className?: string;
  imageClassName?: string;
};

export function CoverImage({
  src,
  alt,
  label,
  className = "",
  imageClassName = "",
}: CoverImageProps) {
  const finalSrc = src ? joinApiPath(src) : "";
  const [failedSrc, setFailedSrc] = useState("");
  const showImage = Boolean(finalSrc) && failedSrc !== finalSrc;

  return (
    <div className={`cover-frame ${className}`}>
      {showImage ? (
        // A plain img keeps support simple for local uploads and arbitrary remote demo images.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={finalSrc}
          alt={alt}
          className={`cover-media ${imageClassName}`.trim()}
          loading="lazy"
          onError={() => setFailedSrc(finalSrc)}
        />
      ) : (
        <div className="cover-fallback">
          <span className="cover-fallback-kicker">Flyer Guide</span>
          <strong>{label || alt}</strong>
        </div>
      )}
      <div className="cover-sheen" />
    </div>
  );
}
