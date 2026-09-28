# Changelog

## 4.34.2 — 2026-09-28

- Restore pointer activation across mail-row content while preserving independent checkbox, star and archive actions.
- Add a real-browser pointer gate across all three densities.

## 4.34.1 — 2026-09-28

Maintenance release based on 4.34.0, containing mail-list support and a settings keyboard fix for Inbox.

- Add spacious `cozy` density to mail rows, loading skeletons and selection bars.
- Add `showAvatar` to `MailRow` and `MailList`, preserving selection controls when avatars are hidden.
- Fix SettingsModal Escape handling from React Native Web text inputs, restore focus on close and preserve nested floating-surface ownership.
- Preserve the existing compact and comfortable densities and default avatar visibility.

No changes from the subsequent shared-shapes or locale work on main are included.
