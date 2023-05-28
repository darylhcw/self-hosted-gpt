const SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
const K = 1024;

/**
 * Display byte string (like 10.00MB) or usage.
 * - Note that this is actually in Kibibyes/Mebibytes (1024) to
 *   match standard file systems, and not just to powers of 1000.
 */
export function formatBytes(bytes: number, decimals: number=2) {
  if (bytes <= 0) return '0 Bytes'

  decimals = decimals >= 0 ? decimals : 0;
  const i = Math.floor(Math.log(bytes) / Math.log(K))

  return `${parseFloat((bytes / Math.pow(K, i)).toFixed(decimals))} ${SIZES[i]}`
}