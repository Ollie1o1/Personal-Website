/** Site route -> its generated Open Graph image path. */
export function ogPath(route: string): string {
  const r = route.replace(/\/+$/, '');
  return r === '' ? '/og/index.png' : `/og${r}.png`;
}
