export type CurrentSeat = { branchId: string; tableId: string; number: number };

export function staleSeatDestination(branchId: string | null, tableId: string | null, seat: CurrentSeat | null): string | null {
  if (!tableId || (seat?.branchId === branchId && seat.tableId === tableId)) return null;
  if (seat) return `/?branchId=${encodeURIComponent(seat.branchId)}&tableId=${encodeURIComponent(seat.tableId)}`;
  return branchId ? `/?branchId=${encodeURIComponent(branchId)}` : '/';
}
