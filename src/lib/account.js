import { supabase } from "./supabase";

/**
 * Deletes the signed-in account, and with it every child on it and
 * everything they played. The database does the work: delete_my_account()
 * in supabase/schema.sql removes the sign-in, and the profile, players
 * and stall_progress rows go with it (on delete cascade). It can only ever
 * delete the account that calls it.
 *
 * Returns Supabase's `{ error }`; never throws.
 */
export const deleteMyAccount = () => supabase.rpc("delete_my_account");

/**
 * Whether an account already uses this email address, so sign-up can say
 * so before the rest of the form is filled in (email_has_account in
 * supabase/schema.sql): true or false, or null when it can't be told
 * (offline, too many checks, the function not added yet, or called off
 * with `signal`). Never throws.
 */
export async function emailHasAccount(address, signal) {
  try {
    const { data, error } = await supabase.rpc("email_has_account", { address }).abortSignal(signal);
    return !error && typeof data === "boolean" ? data : null;
  } catch {
    return null;
  }
}

/*
  The sign-in page says "your account has been deleted" once, right after.
  Signing out sends the visitor there by itself, so the note travels in
  this tab's sessionStorage rather than in router state. If storage is
  blocked, the note is simply not shown; nothing else depends on it.
*/
const DELETED_KEY = "pm-account-deleted";

export function noteAccountDeleted() {
  try {
    window.sessionStorage.setItem(DELETED_KEY, "1");
  } catch {
    // Storage blocked: no note.
  }
}

export function hasAccountDeletedNote() {
  try {
    return window.sessionStorage.getItem(DELETED_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearAccountDeletedNote() {
  try {
    window.sessionStorage.removeItem(DELETED_KEY);
  } catch {
    // Nothing to clear.
  }
}
