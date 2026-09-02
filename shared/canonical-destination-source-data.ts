/**
 * Authoritative serializable destination payloads for Phase 2 migration.
 *
 * Both source modules are deliberately server-import-safe. UI component
 * resolution remains in their client facades; this module never imports a page.
 */
export { TIRTH_YATRAS_SERIALIZABLE as TIRTH_GUIDE_SERIALIZABLE_SOURCE_DATA } from "./tirth-yatras-data";
export { pilgrimageSites as TEMPLE_TOURISM_SERIALIZABLE_SOURCE_DATA } from "./temple-tourism-data";