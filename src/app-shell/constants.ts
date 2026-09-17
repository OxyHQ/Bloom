/**
 * `AppShell`'s measured defaults, in one place so a story, a test and the docs
 * can name the same number instead of each repeating a literal.
 *
 * Every one of these is a PROP. The reason they have defaults at all is that a
 * consumer should never have to reach for a window-width hook, a negative
 * margin or a hardcoded pixel value to get a normal app layout — the shell
 * already knows the shape it is drawing.
 */
export const APP_SHELL_DEFAULTS = {
  /**
   * `dashboard`: the cap on the content column. The dashboard column is
   * FLUID — it fills the page region and stops growing here — so this is a
   * maximum, not a width.
   */
  contentMaxWidth: 1300,
  /**
   * `feed` / `focus`: the reading column's width. 600 is the width a single
   * column of `body-regular` (15/22) holds at roughly 75 characters, which is
   * the measure long-form text stays readable at; wider columns lose the line
   * and narrower ones break too often.
   */
  contentWidth: 600,
  /** The second column's width, `dashboard` and `feed` alike. */
  asideWidth: 320,
  /**
   * The aside needs its own width PLUS the content column PLUS the nav before
   * it earns a place: 272 (panel) + 600 + 320 + three gutters is 1216, so `xl`
   * (1280) is the first tier where the three columns fit without squeezing the
   * content.
   */
  asideFrom: 'xl',
  /**
   * The gap between the shell's edge and its regions, and between the regions.
   *
   * `dashboard` keeps the pair it shipped with — 12 of padding and a 16 column
   * gap — because changing either moves every existing page by four pixels.
   * The other variants use ONE number for both, which is why `gutter` defaults
   * differently per variant rather than being a single constant.
   */
  dashboardGutter: 12,
  dashboardColumnGap: 16,
  gutter: 16,
  /** `split`: the list pane's resting width, and the range a drag may reach. */
  listWidth: 360,
  listMinWidth: 280,
  listMaxWidth: 520,
  /** `split`: the third (info) pane. */
  infoWidth: 320,
  /**
   * `split`: two panes from `md` (768) — 360 of list still leaves 384 of
   * detail, which is a phone's worth of reading width; below it a second pane
   * would be too narrow to be a pane rather than a sliver.
   */
  splitFrom: 'md',
  /** `split`: the third pane needs the same headroom the aside does. */
  infoFrom: 'xl',
} as const;
