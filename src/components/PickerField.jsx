import { useState } from 'react'
import Avatar from './Avatar.jsx'
import AnimatedPicker from './AnimatedPicker.jsx'

// A trigger button (shows the current selection's portrait + name) that
// opens an AnimatedPicker on click. This is the "instead of a dropdown"
// piece - drop this in anywhere a <select> of umas would otherwise go.
export default function PickerField({
  title,
  options,
  value,
  onSelect,
  renderPreview,
  placeholder = 'Select...',
  size = 40,
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

  return (
    <>
      <button type="button" className="picker-field" onClick={() => setOpen(true)}>
        {selected ? (
          <>
            <Avatar characterId={selected.characterId} name={selected.name} size={size} />
            <span className="picker-field-name">{selected.name}</span>
          </>
        ) : (
          <span className="picker-field-placeholder">{placeholder}</span>
        )}
        <span className="picker-field-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      <AnimatedPicker
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        options={options}
        value={value}
        onSelect={onSelect}
        renderPreview={renderPreview}
      />
    </>
  )
}
