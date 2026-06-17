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