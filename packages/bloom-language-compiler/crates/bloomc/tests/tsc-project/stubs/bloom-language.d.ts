// What the emitted modules of this project import from the language.
export type Child = unknown;
export declare function view<P>(render: (props: P) => Child): (props: P) => Child;
export declare function inlineView<P>(render: (props: P) => Child): (props: P) => Child;
export declare function Text(text: string): Child;
export declare function VStack(...children: Child[]): Child;
