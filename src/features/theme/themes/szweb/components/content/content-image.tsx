import { text } from "../../i18n";
import { ZoomableImage } from "./zoomable-image";

export function ContentImage({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="sz-content-figure">
      <ZoomableImage
        src={src}
        alt={alt || caption || text("文章图片", "Article image")}
        width={width}
        height={height}
      />
      {(caption || alt) && <figcaption>{caption || alt}</figcaption>}
    </figure>
  );
}
