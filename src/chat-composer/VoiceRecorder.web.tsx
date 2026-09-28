import { Surface } from '../surface/index.web';
import { Button } from '../button/index.web';
import { ComposerIconButton } from './ComposerIconButton.web';
import { createVoiceRecorder } from './create-voice-recorder';

export const VoiceRecorder = createVoiceRecorder({ Surface, Button, ComposerIconButton });
