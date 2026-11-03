/** Keep labels at their score positions, moving colliding labels onto separate rows. */
export function scoreRangeLabels(positions: number[], width: number) {
  const rows: number[][] = [];
  return positions.map((position) => {
    const x = Math.min(width - 12, Math.max(12, position));
    let row = rows.findIndex((taken) => taken.every((other) => Math.abs(other - x) >= 28));
    if (row < 0) {
      row = rows.length;
      rows.push([]);
    }
    rows[row].push(x);
    return { x, y: 42 + row * 16 };
  });
}
