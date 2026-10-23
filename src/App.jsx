import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Check, ChevronDown, Copy, Download, Heart, Link2, Pipette, Plus, RefreshCw, Share2, Shuffle, Sparkles, Trash2, X } from 'lucide-react'

const MAX = 12
const METHODS = [
  ['complementary', 'Complementary'], ['split', 'Split complementary'], ['analogous', 'Analogous'],
  ['triadic', 'Triadic'], ['tetradic', 'Tetradic'], ['monochromatic', 'Monochromatic'], ['random', 'Surprise me'],
]
const START = ['#563FBC', '#8675D1', '#3C485D', '#7A88A6', '#E5DDE9']
const hexOK = (value) => /^#[0-9a-f]{6}$/i.test(value)
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
function readableText(hex) {
  if (!hexOK(hex)) return '#17181c'
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000 > 150 ? '#17181c' : '#ffffff'
}
function readCurrent() {
  try {
    const value = JSON.parse(localStorage.getItem('swatch-current') || 'null')
    const colors = Array.isArray(value?.colors) ? value.colors.filter(hexOK).slice(0, MAX) : []
    return { colors: colors.length >= 2 ? colors : START, method: METHODS.some(([key]) => key === value?.method) ? value.method : 'complementary' }
  } catch { return { colors: START, method: 'complementary' } }
}
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0, s = 0, l = (max + min) / 2
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) { case r: h = ((g - b) / d) % 6; break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4 }
    h *= 60; if (h < 0) h += 360
  }
  return [h, s * 100, l * 100]
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return `#${[r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
function generate(seed, method, count) {
  const [h, s, l] = hexToHsl(seed)
  if (method === 'random') return Array.from({ length: count }, () => hslToHex(Math.random() * 360, 45 + Math.random() * 45, 34 + Math.random() * 43))
  const angles = method === 'complementary' ? [0, 180] : method === 'split' ? [0, 150, 210] : method === 'analogous' ? [0, 30, 330] : method === 'triadic' ? [0, 120, 240] : method === 'tetradic' ? [0, 90, 180, 270] : Array.from({ length: count }, (_, i) => 0)
  return Array.from({ length: count }, (_, i) => {
    const angle = angles[i % angles.length] + (method === 'analogous' ? Math.floor(i / angles.length) * 18 : 0)
    const lightness = method === 'monochromatic' ? clamp(l + (i - (count - 1) / 2) * 10, 12, 88) : clamp(l + (i > angles.length - 1 ? ((i % 2) ? 9 : -9) : 0), 15, 85)
    const saturation = method === 'monochromatic' ? clamp(s - (i % 3) * 8, 18, 94) : clamp(s + (i > angles.length - 1 ? (i % 2 ? -9 : 7) : 0), 28, 95)
    return hslToHex(h + angle, saturation, lightness)
  })
}
function readShared() {
  const params = new URLSearchParams(location.search)
  const pathColors = location.pathname.match(/\/generator\/([0-9a-f]{6}(?:-[0-9a-f]{6}){1,11})/i)?.[1]?.split('-') || []
  const queryColors = (params.get('c') || '').split(',').filter(Boolean)
  const colors = (queryColors.length ? queryColors : pathColors).map(x => `#${x.replace(/^#/, '')}`).filter(hexOK).slice(0, MAX)
  return { colors, method: METHODS.some(([key]) => key === params.get('m')) ? params.get('m') : 'complementary' }
}
function IconButton({ label, onClick, children, className = '', disabled = false, title }) {
  return <button type="button" aria-label={label} title={title || label} onClick={onClick} disabled={disabled} className={`icon-button ${className}`}>{children}</button>
}
function App() {
  const shared = useMemo(readShared, [])
  const [current] = useState(readCurrent)
  const [colors, setColors] = useState(() => shared.colors.length ? shared.colors : current.colors)
  const [method, setMethod] = useState(() => shared.colors.length ? shared.method : current.method)
  const [seed, setSeed] = useState(() => colors[0] || START[0])
  const [saved, setSaved] = useState(() => { try { const value = JSON.parse(localStorage.getItem('swatch-saved') || '[]'); return Array.isArray(value) ? value : [] } catch { return [] } })
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(null)
  const [name, setName] = useState('Sunday in the garden')
  const [copied, setCopied] = useState(false)
  useEffect(() => { localStorage.setItem('swatch-current', JSON.stringify({ colors, method })) }, [colors, method])
  useEffect(() => { localStorage.setItem('swatch-saved', JSON.stringify(saved)) }, [saved])
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 2300); return () => clearTimeout(id) }, [toast])

  const create = useCallback((nextMethod = method) => { setMethod(nextMethod); setColors(generate(seed, nextMethod, colors.length)); setToast('A fresh palette, just for you') }, [colors.length, method, seed])
  useEffect(() => {
    const onKeyDown = event => {
      if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) {
        event.preventDefault(); create()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [create])
  const updateColor = (i, value) => setColors(prev => prev.map((c, j) => j === i ? value.toUpperCase() : c))
  const addColor = () => { if (colors.length < MAX) setColors(prev => [...prev, hslToHex(Math.random() * 360, 66, 58)]) }
  const removeColor = i => { if (colors.length > 2) setColors(prev => prev.filter((_, j) => j !== i)) }
  const randomizeColor = i => updateColor(i, hslToHex(Math.random() * 360, 52 + Math.random() * 42, 30 + Math.random() * 48))
  const reorder = to => { if (dragging == null || dragging === to) return; setColors(prev => { const next = [...prev]; const [item] = next.splice(dragging, 1); next.splice(to, 0, item); return next }); setDragging(null) }
  const save = () => {
    const entry = { id: crypto.randomUUID(), name: name.trim() || 'Untitled palette', colors: [...colors], method }
    setSaved(prev => [entry, ...prev]); setToast('Saved to your collection')
  }
  const load = entry => { setName(entry.name); setColors([...entry.colors]); setSeed(entry.colors[0] || START[0]); setMethod(entry.method || 'complementary'); setToast('Palette opened') }
  const share = async () => {
    const params = new URLSearchParams({ m: method })
    const url = `${location.origin}/generator/${colors.map(c => c.slice(1).toLowerCase()).join('-')}?${params}`
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); setToast('Share link copied') }
    catch { history.replaceState(null, '', url.replace(location.origin, '')); setToast('Share link ready in your address bar') }
  }
  const copyHex = async color => { try { await navigator.clipboard.writeText(color); setToast(`${color} copied`) } catch { setToast(color) } }
  const download = () => {
    const text = `/* ${name} · ${METHODS.find(([key]) => key === method)?.[1]} */\n:root {\n${colors.map((c, i) => `  --swatch-${i + 1}: ${c};`).join('\n')}\n}`
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/css' })); link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'palette'}.css`; link.click(); URL.revokeObjectURL(link.href)
  }
  const methodLabel = METHODS.find(([key]) => key === method)?.[1] || 'Complementary'
  return <div className="app-shell">
    <header className="topbar">
      <a href="#top" className="brand" aria-label="Swatch it home"><span className="brand-mark"><i /><i /><i /><i /></span><span>swatch<span className="brand-light">it</span></span></a>
      <div className="topbar-center">A COLOUR PALETTE GENERATOR</div>
      <a className="collection-link" href="#collection"><Heart size={15} /> <span>Saved</span><b>{saved.length}</b></a>
    </header>
    <main id="top" className="generator-page">
      <div className="generator-heading"><div><div className="generator-eyebrow"><span /> YOUR COLOUR WORKSPACE</div><h1>The palette generator</h1></div><input aria-label="Palette name" className="palette-name" value={name} onChange={e => setName(e.target.value)} /></div>
      <section className="generator-toolbar" aria-label="Palette tools">
        <label className="method-select"><span className="sr-only">Generation method</span><Sparkles size={16} /><select value={method} onChange={e => { setMethod(e.target.value); create(e.target.value) }}>{METHODS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><ChevronDown size={15} /></label>
        <div className="anchor-control"><label className="anchor-chip" style={{ backgroundColor: seed }}><input type="color" value={hexOK(seed) ? seed : START[0]} onChange={e => setSeed(e.target.value)} aria-label="Choose anchor colour" /></label><input className="seed-hex" value={seed} maxLength={7} aria-label="Anchor colour hex value" onChange={e => { const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`; if (/^#[0-9a-f]{0,6}$/i.test(v)) setSeed(v) }} onBlur={() => !hexOK(seed) && setSeed(START[0])} /><span className="anchor-caption">START COLOUR</span></div>
        <button className="tool-button generate-button" onClick={() => create()}><RefreshCw size={15} /><span>Generate</span><kbd>Space</kbd></button>
        <span className="toolbar-divider" />
        <button className="tool-button add-color-button" onClick={addColor} disabled={colors.length >= MAX}><Plus size={16} /><span>Add colour</span><small>{colors.length}/{MAX}</small></button>
        <div className="toolbar-spacer" />
        <button className="tool-button secondary-tool" onClick={save}><Heart size={16} /><span>Save</span></button>
        <button className="tool-button secondary-tool" onClick={share}>{copied ? <Check size={16} /> : <Share2 size={16} />}<span>{copied ? 'Copied' : 'Share'}</span></button>
        <button className="tool-button icon-tool" aria-label="Export CSS" title="Export CSS" onClick={download}><Download size={16} /></button>
      </section>
      <section className="palette-stage" aria-label="Current colour palette">{colors.map((color, i) => <article key={`${i}-${color}`} className={`palette-swatch ${dragging === i ? 'is-dragging' : ''}`} style={{ backgroundColor: color, color: readableText(color) }} draggable onDragStart={e => { setDragging(i); e.dataTransfer.effectAllowed = 'move' }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); reorder(i) }} onDragEnd={() => setDragging(null)}>
        <div className="swatch-topline"><span className="swatch-number">{String(i + 1).padStart(2, '0')}</span><span className="swatch-drag"><ArrowDownUp size={14} /> DRAG</span></div>
        <div className="swatch-center-actions"><label className="column-action" title={`Change colour ${i + 1}`} onDragStart={e => e.stopPropagation()}><Pipette size={17} /><input aria-label={`Change colour ${i + 1}`} type="color" value={hexOK(color) ? color : '#FFFFFF'} onChange={e => updateColor(i, e.target.value)} /></label><IconButton label={`Randomize colour ${i + 1}`} title="Randomize colour" onClick={() => randomizeColor(i)} className="column-action"><Shuffle size={16} /></IconButton><IconButton label={`Copy ${color}`} title="Copy hex" onClick={() => copyHex(color)} className="column-action"><Copy size={16} /></IconButton><IconButton label={`Remove colour ${i + 1}`} title="Remove colour" onClick={() => removeColor(i)} disabled={colors.length <= 2} className="column-action"><X size={17} /></IconButton></div>
        <div className="swatch-bottom"><span className="swatch-color-label">COLOUR {String(i + 1).padStart(2, '0')}</span><div className="swatch-hex-wrap"><input aria-label={`Hex value ${i + 1}`} value={color} maxLength={7} onChange={e => { const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`; if (/^#[0-9a-f]{0,6}$/i.test(v)) updateColor(i, v) }} onBlur={() => !hexOK(colors[i]) && updateColor(i, '#FFFFFF')} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} /><Copy size={13} /></div></div>
      </article>)}</section>
      <div className="palette-caption"><span>Choose a colour to edit it · hover to explore tools</span><span>{methodLabel} <i /> {colors.length} colours</span></div>
      <details id="collection" className="collection-drawer"><summary><span><Heart size={15} /> My saved palettes</span><b>{saved.length}</b><ChevronDown size={15} /></summary>{saved.length ? <div className="saved-grid">{saved.map(item => <article key={item.id} className="saved-card"><button className="saved-open" onClick={() => load(item)} aria-label={`Open ${item.name}`}><div className="mini-swatches">{item.colors.map((color, i) => <span key={i} style={{ backgroundColor: color }} />)}</div><div className="saved-meta"><span>{item.name}</span><small>{item.colors.length} colours · {METHODS.find(([key]) => key === item.method)?.[1] || 'Custom'}</small></div></button><IconButton label={`Delete ${item.name}`} onClick={() => setSaved(prev => prev.filter(x => x.id !== item.id))} className="delete-saved"><Trash2 size={14} /></IconButton></article>)}</div> : <p className="collection-empty">Save this palette to keep it in your collection on this device.</p>}</details>
      <footer className="footer"><span>SWATCH IT</span><span>Your palettes stay on this device. Share links include the colours.</span><button className="export-inline" onClick={download}><Download size={14} /> Export CSS</button></footer>
    </main>{toast && <div role="status" className="toast"><Check size={15} />{toast}</div>}
  </div>
}

export default App
