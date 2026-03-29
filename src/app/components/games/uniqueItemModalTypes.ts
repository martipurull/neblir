export type TemplateItem = { id: string; name: string; type?: string };

export function templateOptionLabel(t: TemplateItem) {
  return t.type ? `${t.name} (${t.type})` : t.name;
}
