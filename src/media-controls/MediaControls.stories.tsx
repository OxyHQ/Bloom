import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExplicitBadge } from './ExplicitBadge';
import { LikeButton } from './LikeButton';
import { NowPlayingIndicator } from './NowPlayingIndicator';
import { PlayButton } from './PlayButton';
import { PlaybackProgress } from './PlaybackProgress';
import { VolumeControl } from './VolumeControl';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta = {
  title: 'Base/Media Controls',
};

export default meta;

type Story = StoryObj;

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        gap: 24,
        padding: 16,
        backgroundColor: theme.colors.background,
        width: '100%',
        maxWidth: width,
      }}
    >
      {children}
    </View>
  );
}

const noop = () => {};

/** Every control in every size, variant and state. */
export const Matrix: Story = {
  render: function MediaControlsMatrix() {
    const [liked, setLiked] = useState<Record<string, boolean>>({ medium: true });
    const [volume, setVolume] = useState(0.4);
    const [muted, setMuted] = useState(false);
    return (
      <Page>
        {(['accent', 'inverse', 'plain'] as const).map((variant) => (
          <View key={variant} style={{ gap: 8 }}>
            <Caption>{`PlayButton — ${variant}`}</Caption>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <React.Fragment key={size}>
                  <PlayButton variant={variant} size={size} playing={false} onPress={noop} />
                  <PlayButton variant={variant} size={size} playing onPress={noop} />
                </React.Fragment>
              ))}
              <PlayButton variant={variant} playing={false} loading onPress={noop} />
              <PlayButton variant={variant} playing={false} disabled onPress={noop} />
            </View>
          </View>
        ))}

        <View style={{ gap: 8 }}>
          <Caption>LikeButton — small, medium, large; disabled</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {(['small', 'medium', 'large'] as const).map((size) => (
              <LikeButton
                key={size}
                size={size}
                liked={!!liked[size]}
                onLikedChange={(next) => setLiked((l) => ({ ...l, [size]: next }))}
              />
            ))}
            <LikeButton liked onLikedChange={noop} activeColor="#E0457B" />
            <LikeButton liked={false} onLikedChange={noop} disabled />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Caption>ExplicitBadge — small, medium</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ExplicitBadge size="small" />
            <ExplicitBadge />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Caption>NowPlayingIndicator — playing 12/16/24, 3 bars, paused</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
            <NowPlayingIndicator size={12} />
            <NowPlayingIndicator />
            <NowPlayingIndicator size={24} />
            <NowPlayingIndicator bars={3} />
            <NowPlayingIndicator playing={false} />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Caption>PlaybackProgress — bare, inline times, below times with remaining, disabled</Caption>
          <PlaybackProgress value={83} duration={225} buffered={140} />
          <PlaybackProgress value={83} duration={225} buffered={140} showTimes />
          <PlaybackProgress
            value={3725}
            duration={5400}
            buffered={4000}
            showTimes
            showRemaining
            timesPosition="below"
          />
          <PlaybackProgress value={40} duration={225} showTimes disabled />
        </View>

        <View style={{ gap: 8 }}>
          <Caption>VolumeControl — always, hover (web)</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <VolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              muted={muted}
              onMutedChange={setMuted}
            />
            <VolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              muted={muted}
              onMutedChange={setMuted}
              sliderVisibility="hover"
            />
            <VolumeControl volume={0.2} onVolumeChange={noop} />
            <VolumeControl volume={0.8} onVolumeChange={noop} disabled />
          </View>
        </View>
      </Page>
    );
  },
};

/** A fake player: the timer advances the position; drag or use the arrow keys to seek. */
export const Scrubber: Story = {
  render: function MediaControlsScrubber() {
    const theme = useTheme();
    const duration = 225;
    const [playing, setPlaying] = useState(false);
    const [position, setPosition] = useState(83);
    const [preview, setPreview] = useState<number | null>(null);
    const [liked, setLiked] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
      if (!playing) return;
      const id = setInterval(() => {
        setPosition((p) => {
          if (p + 1 >= duration) {
            setPlaying(false);
            return duration;
          }
          return p + 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }, [playing]);

    return (
      <Page width={640}>
        <View
          style={{
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="headline-semibold" numberOfLines={1} style={{ color: theme.colors.text }}>
                  Night Drive
                </Text>
                <ExplicitBadge />
              </View>
              <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
                The Lanterns of Vell
              </Text>
            </View>
            <LikeButton liked={liked} onLikedChange={setLiked} />
            <PlayButton
              playing={playing}
              subject="Night Drive"
              onPress={() => {
                if (!playing && position >= duration) setPosition(0);
                setPlaying((p) => !p);
              }}
            />
          </View>
          <PlaybackProgress
            value={position}
            duration={duration}
            buffered={Math.min(duration, position + 40)}
            showTimes
            onSeekPreview={setPreview}
            onSeek={(s) => {
              setPreview(null);
              setPosition(s);
            }}
            testID="scrubber"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Caption>
              {preview != null ? `Previewing ${Math.round(preview)}s` : `At ${position}s`}
            </Caption>
            <VolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              muted={muted}
              onMutedChange={setMuted}
              sliderVisibility="hover"
            />
          </View>
        </View>
      </Page>
    );
  },
};

const TRACKS = [
  { title: 'Paper Harbour', artist: 'Mira Soltane', length: '3:12', explicit: false },
  { title: 'Night Drive', artist: 'The Lanterns of Vell', length: '3:45', explicit: true },
  { title: 'Glasshouse Summer', artist: 'Odd Tidewater', length: '4:02', explicit: false },
];

/** Controls in a track list: the playing row shows the bars, the others a plain play glyph on hover. */
export const TrackRows: Story = {
  render: function MediaControlsTrackRows() {
    const theme = useTheme();
    const [current, setCurrent] = useState(1);
    const [playing, setPlaying] = useState(true);
    const [liked, setLiked] = useState<Record<number, boolean>>({ 1: true });
    return (
      <Page width={520}>
        {TRACKS.map((track, index) => {
          const isCurrent = index === current;
          return (
            <View key={track.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, alignItems: 'center' }}>
                {isCurrent && playing ? (
                  <NowPlayingIndicator />
                ) : (
                  <PlayButton
                    variant="plain"
                    size="small"
                    playing={false}
                    subject={track.title}
                    onPress={() => {
                      setCurrent(index);
                      setPlaying(true);
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  variant="body-medium"
                  numberOfLines={1}
                  style={{ color: isCurrent ? theme.colors.primary : theme.colors.text }}
                >
                  {track.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {track.explicit && <ExplicitBadge size="small" />}
                  <Text variant="body-2-regular" numberOfLines={1} style={{ color: theme.colors.textSecondary }}>
                    {track.artist}
                  </Text>
                </View>
              </View>
              <LikeButton
                size="small"
                liked={!!liked[index]}
                onLikedChange={(next) => setLiked((l) => ({ ...l, [index]: next }))}
              />
              <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary, minWidth: 36, textAlign: 'right' }}>
                {track.length}
              </Text>
            </View>
          );
        })}
        <PlayButton
          variant="inverse"
          size="small"
          playing={playing}
          onPress={() => setPlaying((p) => !p)}
        />
      </Page>
    );
  },
};
