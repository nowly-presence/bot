export const formatNumber = (value: number | null | undefined): string => {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
};

export const formatRating = (value: number | null | undefined): string => {
  if (!value) {
    return "0.0";
  }

  return value.toFixed(1);
};

export const normalizeSlug = (value: string): string => {
  return value.trim().toLowerCase();
};

export const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

export const chunkMessage = (text: string, maxLength = 2000): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
};