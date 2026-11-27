// As Mention's shared types declare a post's reply permission: a list of a string literal union.
export type ReplyPermission = 'anyone' | 'followers' | 'following' | 'mentioned' | 'nobody';
export interface PermissionPost {
  metadata?: { replyPermission?: ReplyPermission[] };
}
