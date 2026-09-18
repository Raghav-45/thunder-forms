export function googleSheetsOAuthResultMessage(result: string): {
  message: string
  type: 'error' | 'success'
} {
  switch (result) {
    case 'connected':
      return { type: 'success', message: 'Google account connected' }
    case 'denied':
      return { type: 'error', message: 'Google access was denied' }
    case 'scope-denied':
      return {
        type: 'error',
        message: 'Google did not grant required Drive file access',
      }
    case 'invalid-client':
      return {
        type: 'error',
        message: 'Google rejected OAuth client credentials. Update Client Secret and restart.',
      }
    case 'missing-refresh-token':
      return {
        type: 'error',
        message: 'Google did not return ongoing access. Connect Google again.',
      }
    default:
      return {
        type: 'error',
        message: 'Google connection failed. Check the server log and try again.',
      }
  }
}
