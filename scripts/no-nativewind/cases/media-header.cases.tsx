import { FollowButton } from '@bloom/media-header';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'FollowButton plain': () => <FollowButton following={false} onFollowChange={() => {}} />,
  'FollowButton following, icon only': () => (
    <>
      <FollowButton following onFollowChange={() => {}} />
      <FollowButton following={false} iconOnly onFollowChange={() => {}} />
    </>
  ),
  'FollowButton styled': () => (
    <FollowButton
      following={false}
      onFollowChange={() => {}}
      appearance="outline"
      material="flat"
      style={{ height: 40, borderRadius: 20 }}
      textStyle={{ fontSize: 16, color: '#123456' }}
      testID="follow"
    />
  ),
};
