/** Props a TS module declares, spread into a Bloom view (`view X(..PostCardProps)`). */
export interface PostCardProps {
  title: string;
  likes: number;
  subtitle?: string;
  onOpen?: () => void;
}
