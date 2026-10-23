/**
 * Photo limits shared by browser and server code. Kept free of zod so client
 * components can import them without shipping the validator to the browser.
 */

/** How long a processed photo stays available at /preview/<id>. */
export const PHOTO_RESULT_TTL_DAYS = 7;
