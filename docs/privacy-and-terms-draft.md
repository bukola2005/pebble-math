# Pebble Math — privacy notice and terms (DRAFT)

**This is a draft, not legal advice.** It describes accurately what the software currently does, in plain language, so that a qualified lawyer has something concrete to review rather than a blank page. Pebble Math collects information about children, which puts it under Nigeria's Data Protection Act, and under COPPA and GDPR-K if it is ever used outside Nigeria. **Have a lawyer review this before any family outside your own uses the product.**

Replace every `[BRACKETED]` item before publishing.

---

# Privacy Notice

**Last updated:** [DATE]

Pebble Math is a maths game for children, run by [MOVABLE GAMES / LEGAL ENTITY NAME] of [ADDRESS].

## The short version

A parent or teacher opens the account. **A child never signs up, never gives an email address, and never has a password.** We ask for as little as the game needs to work, and nothing more.

## What we collect

**From the adult who opens the account**

- Email address — to sign you in and to let you reset your password
- Password — stored only as a hash, a one-way scramble that nobody, including us, can turn back into your password
- Whether you are a parent or a teacher
- Your name, if you give one

**About each child the adult adds**

- A display name, chosen by the adult. A first name or a nickname is enough; there is no need to use a full name.
- An age band, such as "under 7" or "7 to 8". Not a date of birth.
- A class level, if the adult chooses to give one
- A game name the child picks from a list of words we provide. The child never types it.
- Which character and which monster were chosen
- Which parts of the game the child has finished

**Stored in the browser**

Three things, all of which stay on the device:

- Whether sound is switched on or off
- Your sign-in session, so you are not asked to sign in on every page
- A short note used only to explain, on the next screen, that an account was deleted

None of these are sent to us as data about you, and none are used for tracking or advertising.

## What we do not collect

- A child's email address, password or date of birth
- Photographs, video or voice recordings
- Location
- Contacts
- Anything typed in free text by a child. There is no text box anywhere in the child's part of the game.

We do not use advertising, we do not use analytics or tracking tools, and we do not sell or share personal information with anyone for their own purposes.

## Who can see a child's information

Only the adult who added them. Accounts are separated at the database level, so one account cannot read another account's children.

## Reading aloud

The guide's words are read aloud using voices built into the device. Nothing spoken in the game is sent anywhere.

## Who else is involved

- **Supabase** stores the accounts and the game data, on servers in [REGION]. They process it on our instructions and do not use it for anything of their own. Their sign-in records include the IP address a sign-in came from, kept as a security measure.
- **Vercel** serves the website itself. Like any web host, their records include the IP address each page was requested from.

We do not load fonts, scripts or anything else from other companies' servers. Everything the site needs comes from the site itself.

## How long we keep it

For as long as the account exists. If an account is deleted, everything belonging to it, including every child's record, is deleted with it.

## Your rights

You may ask us to show you, correct, or delete anything we hold about you or your child, at any time. Write to [EMAIL] and we will respond within [30 DAYS].

A parent or teacher can delete a child's record from the dashboard at any time. Deleting a child removes everything about them.

## Children's privacy

Pebble Math is built for children aged roughly five to nine, and the account belongs to the adult who created it. We rely on that adult's consent for everything we hold about a child. A child cannot create an account, cannot sign in, and cannot contact anyone through the game.

If you believe a child's information has reached us without an adult's consent, write to [EMAIL] and we will delete it.

## Changes

If this notice changes in a way that matters, we will tell account holders by email before it takes effect.

## Contact

[EMAIL] · [ADDRESS]

---

# Terms of Use

**Last updated:** [DATE]

## What Pebble Math is

A maths game for children, used through a web browser. It is in development, and parts of it are unfinished.

## Accounts

You must be 18 or over to open an account. The account is yours: keep the password to yourself, and tell us at [EMAIL] if you think someone else has it.

By adding a child, you confirm you are their parent, guardian, or their teacher acting with the school's authority, and that you agree to us holding the information described in the privacy notice.

## Using it properly

Use Pebble Math for teaching and learning. Do not try to break into it, copy it, resell it, or use it to store anything that is not about learning.

## What belongs to whom

The game, its artwork, its characters and its writing belong to [LEGAL ENTITY NAME]. You may use them within the game; you may not copy them out of it.

## What we promise

Honestly, not much yet. Pebble Math is provided as it is. We do not promise it will always work, that it will suit any particular child, or that it will produce any particular result at school. We will not be liable for loss arising from using it, except where the law does not allow us to say that.

## Ending it

You may delete your account at any time. We may close an account that breaks these terms, and will tell you why.

## Changes

We may change these terms. If a change matters, we will tell account holders by email before it takes effect.

## Which law applies

The laws of the Federal Republic of Nigeria. [CONFIRM WITH YOUR LAWYER.]

## Contact

[EMAIL] · [ADDRESS]

---

## Notes for whoever reviews this

1. **Age and consent.** Pebble Math never speaks to a child directly for consent — the adult does everything. That is deliberate and it is the main reason the design is as restrictive as it is. Worth confirming it is sufficient under the NDPA, and under COPPA and GDPR-K if the product ever goes outside Nigeria.
2. **Schools.** A teacher adding thirty children raises a different question from a parent adding two. If schools are a real market, that route likely needs its own agreement.
3. **Data location.** Supabase's region needs filling in, and it should be checked against any NDPA requirement about where Nigerian data may sit.
4. **The 18-and-over rule is stated in the terms but not checked at sign-up.** Nothing stops a child creating an account. Worth a view on whether a stated rule is enough.
5. **Account separation has been tested with two real accounts** on the live database, and one could not see the other's children. It is enforced by row-level security in the database, not by the app.

### Closed since the first draft

- Self-service account deletion now exists, and removes the account, the profile, every child and their progress.
- Fonts are now served from the site itself. No third-party host receives visitor IP addresses.
- Reading aloud now uses on-device voices only, so no spoken line, and no child's game name, leaves the device.
