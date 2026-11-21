export function isCompanionPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  const exact = [
    '/seating',
    '/reservations',
    '/my-reservations',
    '/management/reservations',
    '/management/inventory',
    '/management/ratings',
    '/management/loyalty',
    '/my-reviews',
    '/reviews',
    '/my-loyalty',
    '/waiter/billing',
    '/my-receipts',
    '/checkout',
    '/loyalty/redeem',
  ];
  if (exact.includes(pathname)) return true;
  return ['/waiter/billing/', '/my-receipts/', '/checkout/', '/loyalty/redeem/']
    .some(prefix => pathname.startsWith(prefix));
}

export function toInnerPath(path: string): string {
  if (path.split(/[?#]/)[0] === '/seating') {
    return '/';
  }
  if (path.split(/[?#]/)[0] === '/reservations') {
    const queryIndex = path.indexOf('?');
    return queryIndex >= 0
      ? `/reservations/new${path.slice(queryIndex)}`
      : '/reservations/new';
  }
  return path;
}
