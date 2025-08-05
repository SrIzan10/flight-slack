import { db } from "..";

export async function largestMortalsId(autoSum = false) {
  return db.flight.findFirst({
    orderBy: { mortalsId: 'desc' },
    select: { mortalsId: true },
  }).then(flight => {
    return (flight?.mortalsId ?? 0) + (autoSum ? 1 : 0);
  });
}