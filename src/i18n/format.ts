export function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{{${key}}}`).join(String(value)),
    template
  );
}
