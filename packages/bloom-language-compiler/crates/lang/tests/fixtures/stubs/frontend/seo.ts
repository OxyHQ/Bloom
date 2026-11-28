// An optional of an optional (Mention's `profileSEOPolicy`): `server` is a `ReturnType` that may
// be `undefined`, and the returned field is `c ? undefined : server`.
function readServerSEO(flag: boolean) {
  if (!flag) return undefined;
  return { title: 'x' };
}
export function profileSEOPolicy(flag: boolean, server?: ReturnType<typeof readServerSEO>) {
  const authoritative = flag ? undefined : server;
  return { server: authoritative };
}
