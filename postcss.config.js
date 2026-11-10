/* ============================================================
   Reading comfort
   Every authored font-size is wrapped in a calc() expression here
   so the whole interface responds to the saved text-size setting.
   Write normal sizes in CSS; this plugin handles the scaling.
   ============================================================ */

function usesDisplayScale(value) {
  if (value.startsWith('clamp(')) return true

  const px = value.match(/^([\d.]+)px$/)
  if (px) return Number(px[1]) >= 19

  const rem = value.match(/^([\d.]+)rem$/)
  if (rem) return Number(rem[1]) >= 1.45

  return false
}

const textScalePlugin = {
  postcssPlugin: 'lexicon-text-scale',
  Declaration(decl) {
    if (decl.prop !== 'font-size') return

    const value = decl.value.trim()
    // Relative sizes already follow their parent's scaled size.
    if (
      !/^(clamp\(|[\d.]+(px|rem))$/.test(value) ||
      value.includes('var(')
    ) {
      return
    }

    const scale = usesDisplayScale(value) ? '--display-scale' : '--text-scale'
    decl.value = `calc(${value} * var(${scale}))`
  },
}

export default {
  plugins: [textScalePlugin],
}
