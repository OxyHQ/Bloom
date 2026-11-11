import { Platform, Share } from 'react-native';

import { shareFile, shareUrl } from '../hooks/share';
import * as clipboard from '../hooks/clipboard';

jest.mock('../hooks/clipboard');
const writeText = clipboard.writeClipboardText as jest.Mock;

describe('shareUrl', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reports shared, dismissed and copied, never throwing', async () => {
    Platform.OS = 'ios';
    const share = jest.spyOn(Share, 'share');
    share.mockResolvedValueOnce({ action: Share.sharedAction, activityType: undefined });
    expect(await shareUrl({ url: 'https://a.b', title: 'T' })).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'T', message: undefined, url: 'https://a.b' });

    share.mockResolvedValueOnce({ action: Share.dismissedAction, activityType: undefined });
    expect(await shareUrl({ url: 'https://a.b' })).toBe('dismissed');

    writeText.mockResolvedValueOnce(undefined);
    share.mockRejectedValueOnce(new Error('no sheet'));
    expect(await shareUrl({ url: 'https://a.b', copyText: 'copy me' })).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('copy me');

    writeText.mockRejectedValueOnce(new Error('no clipboard'));
    share.mockRejectedValueOnce(new Error('no sheet'));
    expect(await shareUrl({ url: 'https://a.b' })).toBe('failed');
  });

  it('puts the link in the message on Android, whose sheet has no url field', async () => {
    Platform.OS = 'android';
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    await shareUrl({ url: 'https://a.b', message: 'Look' });
    expect(share).toHaveBeenCalledWith({ title: undefined, message: 'Look\nhttps://a.b' });
    Platform.OS = 'ios';
  });
});

describe('shareFile', () => {
  it('is unavailable on native without expo-sharing', async () => {
    Platform.OS = 'ios';
    expect(await shareFile({ uri: 'file:///a.pdf', filename: 'a.pdf' })).toBe('unavailable');
  });
});
