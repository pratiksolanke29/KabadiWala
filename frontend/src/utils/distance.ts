// "12.3 km" under 100 km, "847 km" above (straight-line distance from the server).
export function formatKm(km: number): string {
  return km < 100 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString('en-IN')} km`;
}
