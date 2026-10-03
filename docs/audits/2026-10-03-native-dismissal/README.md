# Native dismissal completion

When a native Dialog disabled backdrop dismissal, Android Back still hid its Modal. The close completion then consulted the veto and dropped onDismiss, leaving the surface promise unresolved; Oxy’s sign-in button stayed loading and reopening reused the stale surface. The same completion veto also swallowed explicit close callbacks.

Source efa54000 checks user Back/backdrop/Escape/pan requests before closing and always notifies completion of an accepted or explicit close. A rejected drag returns to its open position. Generation guards remain around asynchronous gesture completion. No auth runtime or consumer workaround changed.

RED has2fail/19pass. Final6suites/79pass cover protected Back, explicit ref and X close once/reopen, allowed Back, pan refusal, and existing surface/web keyboard behavior. TS and real build/pack/export/freshness gates pass. Jest uses real native components with platform/animation mocks; it does not prove pixel hit-testing or Android timing. Root’s original emulator observation uses6.2.0, while this fix targets current main7.1.1 where the source still matches. Candidate device replay and publication remain pending.

A separate touch hit-testing failure in the native sign-in dialog remains unresolved. Keyboard Tab/Enter successfully completed real authentication; this correction makes no claim to repair touch layout. Shared Bloom checkout and active sibling Metro worktrees were untouched.
