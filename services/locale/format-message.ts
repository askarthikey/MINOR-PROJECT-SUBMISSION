export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replaceAll(/\{(\w+)\}/g, (match, token) => String(values[token] ?? match));
}
