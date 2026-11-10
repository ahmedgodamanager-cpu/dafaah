/**
 * The app's English font (see src/index.css), for pages written as HTML strings such as print
 * windows. Those open on about:blank, so the font needs this site's full address.
 */
export function englishFontFace(): string {
  return `@font-face {
    font-family: 'Roken';
    src: url('${window.location.origin}/fonts/Roken-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    unicode-range: U+0021-007E, U+00A1-00AC, U+00AE-024F, U+0300-036F, U+2010-205E, U+20A0-20CF, U+2100-22FF;
  }`;
}
