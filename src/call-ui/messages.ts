import { defineMessages, type MessageCatalog } from '../locale/messages';
import type {
  CallControlLabels,
  CallHistoryLabels,
  CallPipCorner,
  CallStatusLabels,
  IncomingCallLabels,
} from './types';
import { corner } from './message-helpers';

/**
 * Every fixed string the call-ui family draws or announces, in each Bloom
 * language. A caller's `labels` / `format*` props still win over any entry.
 */
export interface CallUiMessages {
  status: CallStatusLabels;
  controls: CallControlLabels;
  /** `CallScreen`'s own chrome, beside the status lines. */
  screen: {
    minimise: string;
    chat: string;
    participants: string;
    /** Names the PiP's move button, given the corner it is IN. */
    movePip: (corner: CallPipCorner) => string;
  };
  /** The corner names `movePip` speaks. */
  pipCorners: Record<CallPipCorner, string>;
  history: CallHistoryLabels;
  incoming: IncomingCallLabels;
  /** `CallMinimisedPill`'s press-to-return name, without and with the name. */
  returnToCall: string;
  returnToCallWith: (name: string) => string;
  /** `GroupCallBar`'s trailing button and speaking line. */
  join: string;
  leave: string;
  speaking: (name: string) => string;
  /** `GroupCallGrid`'s overflow tile, given the hidden count. */
  overflow: (count: number) => string;
  /** A muted tile's name, given the participant's. */
  muted: (name: string) => string;
}

const CORNERS: Record<'en', Record<CallPipCorner, string>> = {
  en: {
    'top-left': 'top left',
    'top-right': 'top right',
    'bottom-left': 'bottom left',
    'bottom-right': 'bottom right',
  },
};

export const CALL_UI_MESSAGES: MessageCatalog<CallUiMessages> = defineMessages<CallUiMessages>(
  'CALL_UI_MESSAGES',
  {
    status: {
      calling: 'Calling…',
      ringing: 'Ringing',
      connecting: 'Connecting…',
      active: 'Connected',
      reconnecting: 'Reconnecting…',
      onHold: 'On hold',
      ended: 'Call ended',
    },
    controls: {
      mute: 'Mute',
      unmute: 'Unmute',
      speakerOn: 'Turn speaker on',
      speakerOff: 'Turn speaker off',
      videoOn: 'Turn camera on',
      videoOff: 'Turn camera off',
      flipCamera: 'Flip camera',
      screenShareOn: 'Share screen',
      screenShareOff: 'Stop sharing screen',
      addParticipant: 'Add participant',
      endCall: 'End call',
    },
    screen: {
      minimise: 'Minimise call',
      chat: 'Open chat',
      participants: 'Participants',
      movePip: (c) => `Move self view (now ${corner(CORNERS.en, c)})`,
    },
    pipCorners: CORNERS.en,
    history: {
      incoming: 'Incoming',
      outgoing: 'Outgoing',
      missed: 'Missed',
      declined: 'Declined',
      callBack: (name) => `Call ${name} back`,
    },
    incoming: {
      accept: 'Accept',
      decline: 'Decline',
      message: 'Message',
      remind: 'Remind me',
      slideToAnswer: 'Slide to answer',
      voice: 'Incoming voice call',
      video: 'Incoming video call',
    },
    returnToCall: 'Return to call',
    returnToCallWith: (name) => `Return to call with ${name}`,
    join: 'Join',
    leave: 'Leave',
    speaking: (name) => `${name} is speaking`,
    overflow: (n) => `+${n} more`,
    muted: (name) => `${name}, muted`,
  },
);
