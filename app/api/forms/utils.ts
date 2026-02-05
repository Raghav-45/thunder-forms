/**
 * Determines the status of a form based on its response count, max submissions, and expiry date
 * Returns a simplified status for API responses: "Active" or "Closed | [reason]"
 */
export function getFormStatus(
  responseCount: number,
  maxSubmissions: number | null,
  expiresAt: string | null
): string {
  const hasExpired = expiresAt && new Date(expiresAt) < new Date()
  const hasReachedMaxSubmissions =
    maxSubmissions !== null && maxSubmissions > 0 && responseCount >= maxSubmissions

  // Determine status based on conditions
  if (hasExpired && hasReachedMaxSubmissions) {
    return 'Closed | Expired & Completed'
  }

  if (hasExpired) {
    return 'Closed | Expired'
  }

  if (hasReachedMaxSubmissions) {
    return 'Closed | Completed'
  }

  // Form is active
  return 'Active'
}
