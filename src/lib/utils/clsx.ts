export function clsx(...classes: (string | null | undefined)[]): string {
  return classes.filter((cn) => Boolean(cn)).join(" ");
}
