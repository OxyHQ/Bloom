/**
 * A module that DELIBERATELY throws away one of the values a hook hands back, so
 * `hook-subscriptions-are-read.test.ts` can prove its detector fires. It carries
 * both halves of the control: `unreadFlag` is bound and never read, which the
 * detector must report, and `readFlag` is bound and read, which it must stay
 * quiet about — otherwise the cheapest way to green the gate would be deleting a
 * binding that is doing its job.
 *
 * Nothing imports this at runtime. bob's `exclude` keeps it out of `lib/`, and
 * `files: ["src", …]` does ship it inside the tarball's `src/` like the other
 * 137 test files there — but no entry point reaches it, so no bundler links it.
 * It is a plain `.ts` with no React import because the
 * detector reads source, never types: a call named `use…` bound to a name is all
 * the shape there is.
 *
 * The destructuring RENAMES, which is not decoration — it reproduces the shipped
 * shape (`const { state: pressed, onIn: onPressIn } = useInteractionState()`) and
 * it is what keeps the control honest. A hook declared in the same file as its
 * caller mentions its own property names in its return type and its return
 * object, and the detector counts every occurrence of a spelling as a possible
 * read, so an unrenamed fixture would be silently unreportable for a reason no
 * real call site has.
 */

/** Stands in for a real subscription — a hook by name, with two return values. */
function useFixtureInteractionState(): { first: boolean; second: boolean } {
  return { first: false, second: false };
}

export function fixtureComponentBody(): boolean {
  const { first: readFlag, second: unreadFlag } = useFixtureInteractionState();
  return readFlag;
}
