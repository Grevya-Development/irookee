import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o)
  )

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val])
  }

  const remove = (val: string) => onChange(selected.filter(s => s !== val))

  return (
    <div ref={ref} className="relative">
      <div
        className="flex flex-wrap gap-1 min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text"
        onClick={() => setOpen(true)}
      >
        {selected.map(s => (
          <Badge key={s} variant="secondary" className="gap-1 py-0.5">
            {s}
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(s); }}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 min-w-[80px] outline-none bg-transparent placeholder:text-muted-foreground"
          placeholder={selected.length === 0 ? placeholder : ''}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => { toggle(opt); setSearch(''); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
