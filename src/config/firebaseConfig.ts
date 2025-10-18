/**
 * Firebase Configuration
 *
 * Feature flags to control Firebase operations and prevent quota issues
 */

/**
 * FIRESTORE AUTO-WRITES DISABLED
 *
 * Automatic Firestore writes (auto-save, real-time sync) are disabled by default
 * to prevent quota exceeded errors.
 *
 * Manual saves are always enabled when user explicitly clicks "Save"
 *
 * When auto-writes are disabled:
 * - No automatic background saves
 * - No real-time shape sync to Firestore
 * - User must manually save their work
 * - Manual saves still work and persist to Firebase
 */
export const ENABLE_AUTO_FIRESTORE_WRITES = false;

/**
 * Helper function to check if automatic Firestore writes are enabled
 */
export function canAutoWriteToFirestore(): boolean {
  if (!ENABLE_AUTO_FIRESTORE_WRITES) {
    return false;
  }
  return true;
}

/**
 * Helper function to check if manual saves are allowed
 * Manual saves are ALWAYS enabled regardless of auto-write setting
 */
export function canManualSaveToFirestore(): boolean {
  return true; // Manual saves always enabled
}
