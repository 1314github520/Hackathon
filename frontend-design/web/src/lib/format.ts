export function formatMeta(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return `${label}：待补充`;
  }

  return `${label}：${value}`;
}
