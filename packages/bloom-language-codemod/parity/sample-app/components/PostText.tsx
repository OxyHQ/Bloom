// A post's text with its links: a mention handed to the router's Link, a URL
// that opens on a press; and a footer link that is a text with a press.
import { Link } from 'expo-router';
import { Text } from 'react-native';

export function PostText({ open, handle }: { open: () => void; handle: string }) {
  return (
    <Text className="text-sm text-foreground">
      Hi{' '}
      <Link href={`/@${handle}`} push asChild>
        <Text className="text-primary">@{handle}</Text>
      </Link>
      , see{' '}
      <Text className="text-primary" onPress={open}>
        oxy.so
      </Text>
    </Text>
  );
}

export function FooterLink({ open }: { open: () => void }) {
  return (
    <Text className="text-xs text-muted-foreground" onPress={open}>
      Terms
    </Text>
  );
}
