const warmedMedia = new Set();
const pendingMedia = new Map();

function normalizeMediaSrc(value) {
  const src = String(value || "").trim();

  if (!src) {
    return "";
  }

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  if (/^(https?:)?\/\//i.test(src)) {
    return src;
  }

  if (src.startsWith("/")) {
    return src;
  }

  return "";
}

export function warmMediaUrls(values) {
  if (typeof window === "undefined" || typeof window.Image === "undefined") {
    return;
  }

  const items = Array.isArray(values) ? values : [values];

  items.forEach((item) => {
    const src = normalizeMediaSrc(item);

    if (!src || warmedMedia.has(src) || pendingMedia.has(src)) {
      return;
    }

    const image = new window.Image();

    const finalize = () => {
      pendingMedia.delete(src);
      warmedMedia.add(src);
      image.onload = null;
      image.onerror = null;
    };

    image.decoding = "async";
    image.onload = finalize;
    image.onerror = () => {
      pendingMedia.delete(src);
      image.onload = null;
      image.onerror = null;
    };

    pendingMedia.set(src, image);
    image.src = src;
  });
}
