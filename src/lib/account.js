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
