// JSON decode, as a derived `Codable` decode would run it: JSON.parse, then a typed walk that
// checks every field and builds the model (classes, so Static Hermes' typed mode can lay them out).
class Actor {
  id: string;
  username: string;
  name: string;
  avatar: string;
  verified: boolean;
  constructor(id: string, username: string, name: string, avatar: string, verified: boolean) {
    this.id = id;
    this.username = username;
    this.name = name;
    this.avatar = avatar;
    this.verified = verified;
  }
}
class Post {
  id: string;
  text: string;
  likes: number;
  boosts: number;
  media: string[];
  constructor(id: string, text: string, likes: number, boosts: number, media: string[]) {
    this.id = id;
    this.text = text;
    this.likes = likes;
    this.boosts = boosts;
    this.media = media;
  }
}
class Notification {
  id: string;
  kind: number;
  createdAt: number;
  read: boolean;
  actor: Actor;
  post: Post | null;
  constructor(
    id: string,
    kind: number,
    createdAt: number,
    read: boolean,
    actor: Actor,
    post: Post | null,
  ) {
    this.id = id;
    this.kind = kind;
    this.createdAt = createdAt;
    this.read = read;
    this.actor = actor;
    this.post = post;
  }
}
const KINDS: string[] = ['like', 'boost', 'follow', 'mention', 'reply', 'quote'];

function str(o: any, k: string): string {
  const v: any = o[k];
  if (typeof v !== 'string') throw new Error(k);
  return v;
}
function num(o: any, k: string): number {
  const v: any = o[k];
  if (typeof v !== 'number') throw new Error(k);
  return v;
}
function bool(o: any, k: string): boolean {
  const v: any = o[k];
  if (typeof v !== 'boolean') throw new Error(k);
  return v;
}
function kindOf(s: string): number {
  for (let i: number = 0; i < KINDS.length; i++) {
    if (KINDS[i] === s) return i;
  }
  throw new Error(s);
}
function actor(o: any): Actor {
  return new Actor(
    str(o, 'id'),
    str(o, 'username'),
    str(o, 'name'),
    str(o, 'avatar'),
    bool(o, 'verified'),
  );
}
function post(o: any): Post {
  const m: any = o.media;
  const media: string[] = [];
  for (let i: number = 0; i < m.length; i++) {
    const v: any = m[i];
    if (typeof v !== 'string') throw new Error('media');
    media.push(v);
  }
  return new Post(str(o, 'id'), str(o, 'text'), num(o, 'likes'), num(o, 'boosts'), media);
}
function notification(o: any): Notification {
  const p: any = o.post;
  return new Notification(
    str(o, 'id'),
    kindOf(str(o, 'type')),
    Date.parse(str(o, 'createdAt')),
    bool(o, 'read'),
    actor(o.actor),
    p === null || p === undefined ? null : post(p),
  );
}
function decode(text: string): Notification[] {
  const root: any = JSON.parse(text);
  const items: any = root.notifications;
  const out: Notification[] = [];
  for (let i: number = 0; i < items.length; i++) out.push(notification(items[i]));
  return out;
}
// A deterministic page of 200 notifications (the Mention API's shape, trimmed).
function payload(n: number): string {
  const parts: string[] = [];
  for (let i: number = 0; i < n; i++) {
    const kind: string = KINDS[i % 6];
    const hasPost: boolean = kind !== 'follow';
    const s: string = String(i);
    parts.push(
      '{"id":"n' +
        s +
        '","type":"' +
        kind +
        '","createdAt":"2026-11-' +
        String(10 + (i % 18)) +
        'T12:' +
        String(10 + (i % 50)) +
        ':00.000Z","read":' +
        String(i % 3 === 0) +
        ',"actor":{"id":"u' +
        s +
        '","username":"user' +
        s +
        '","name":"User Number ' +
        s +
        '","avatar":"https://cdn.mention.earth/a/' +
        s +
        '.jpg","verified":' +
        String(i % 7 === 0) +
        '}' +
        ',"post":' +
        (hasPost
          ? '{"id":"p' +
            s +
            '","text":"Post text ' +
            s +
            ' with some words in it to make it look real \\u00e9","likes":' +
            String(i * 3) +
            ',"boosts":' +
            s +
            ',"media":["https://cdn.mention.earth/m/' +
            s +
            'a.jpg","https://cdn.mention.earth/m/' +
            s +
            'b.jpg"]}'
          : 'null') +
        '}',
    );
  }
  // Typed mode has no Array.prototype.join: concatenated by hand.
  let body: string = '';
  for (let i: number = 0; i < parts.length; i++) body = i === 0 ? parts[i] : body + ',' + parts[i];
  return '{"notifications":[' + body + '],"cursor":"c1"}';
}
const text: string = payload(200);
const R: number = 1000;
let check: number = 0;
const p0: number = Date.now();
for (let r: number = 0; r < R; r++) {
  const v: any = JSON.parse(text);
  check += v.notifications.length;
}
const p1: number = Date.now();
for (let r: number = 0; r < R; r++) {
  const list: Notification[] = decode(text);
  const u: any = list[r % 200].actor.username;
  check += u.length;
}
const p2: number = Date.now();
const tx: any = text;
print(
  JSON.stringify({
    bytes: tx.length,
    parseUs: ((p1 - p0) * 1000) / R,
    decodeUs: ((p2 - p1) * 1000) / R,
    walkUs: ((p2 - p1 - (p1 - p0)) * 1000) / R,
    check: check,
  }),
);
