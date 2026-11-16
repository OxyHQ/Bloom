/** Shared content edge used by list sections and sidebar headings. */
export const LIST_ROW_INSET = 10;
export const LIST_ROW_MIN_HEIGHT = 56;
export const LIST_STYLE_ID = 'bloom-list';
export const LIST_CSS = `
[data-bloom-list-row] { container-type:inline-size; transition:background-color 120ms; }
[data-bloom-list-link]:focus-visible { outline:2px solid var(--bloom-list-ring); outline-offset:-2px; }
[data-bloom-list-row]:has(:focus-visible), [data-bloom-list-row][data-active="true"] { background:var(--bloom-list-selected); }
[data-bloom-list-supporting="adaptive"] { -webkit-line-clamp:3 !important; }
@container (max-width:560px) { [data-bloom-list-supporting="adaptive"] { -webkit-line-clamp:2 !important; } }
@container (max-width:380px) { [data-bloom-list-supporting="adaptive"] { -webkit-line-clamp:1 !important; } }
[data-bloom-list-identity]:has(:focus-visible) [data-bloom-list-selection] { opacity:1 !important; }
[data-bloom-list-identity]:has(:focus-visible) [data-bloom-list-portrait] { opacity:0; }
[data-bloom-list-actions] { display:none !important; }
[data-bloom-list-row]:has(:focus-visible) [data-bloom-list-actions],
[data-bloom-list-row]:has([aria-expanded="true"]) [data-bloom-list-actions] { display:flex !important; }
[data-bloom-list-row][data-has-actions="true"]:has(:focus-visible) [data-bloom-list-meta],
[data-bloom-list-row][data-has-actions="true"]:has([aria-expanded="true"]) [data-bloom-list-meta] { display:none !important; }
@media (hover:hover) {
 [data-bloom-list-row][data-interactive="true"]:hover { background:var(--bloom-list-selected); }
 [data-bloom-list-row]:hover [data-bloom-list-actions] { display:flex !important; }
 [data-bloom-list-row][data-has-actions="true"]:hover [data-bloom-list-meta] { display:none !important; }
 [data-bloom-list-identity]:hover [data-bloom-list-selection] { opacity:1 !important; }
 [data-bloom-list-identity]:hover [data-bloom-list-portrait] { opacity:0; }
}
@media (hover:none), (max-width:600px) {
 [data-bloom-list-actions] { display:none !important; }
 [data-bloom-list-meta] { display:flex !important; }
}
[data-bloom-swipe-active="true"] [data-bloom-list-actions] { display:none !important; }
[data-bloom-swipe-active="true"] [data-bloom-list-meta] { display:flex !important; }
`;
