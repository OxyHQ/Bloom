import { Surface } from '../surface';
import { Button } from '../button';
import { ComposerIconButton } from './ComposerIconButton';
import { createVoiceRecorder } from './create-voice-recorder';

export const VoiceRecorder = createVoiceRecorder({ Surface, Button, ComposerIconButton });
