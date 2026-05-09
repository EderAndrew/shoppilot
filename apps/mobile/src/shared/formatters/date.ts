export function formatArchivedDate(archivedAt: string | null): string {
  if (!archivedAt) return "";
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(archivedAt));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
