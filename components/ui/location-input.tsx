import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

const INDIAN_CITIES = [
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India',
  'Ahmedabad, India', 'Chennai, India', 'Kolkata, India', 'Pune, India',
  'Jaipur, India', 'Lucknow, India', 'Surat, India', 'Kanpur, India',
  'Nagpur, India', 'Indore, India', 'Thane, India', 'Bhopal, India',
  'Visakhapatnam, India', 'Patna, India', 'Vadodara, India', 'Ghaziabad, India',
  'Ludhiana, India', 'Agra, India', 'Nashik, India', 'Ranchi, India',
  'Coimbatore, India', 'Kochi, India', 'Gurgaon, India', 'Noida, India',
  'Chandigarh, India', 'Mysore, India', 'Guwahati, India', 'Bhubaneswar, India',
  'Dehradun, India', 'Mangalore, India', 'Trivandrum, India', 'Jodhpur, India',
  'Raipur, India', 'Amritsar, India', 'Varanasi, India', 'Udaipur, India',
  'New York, USA', 'San Francisco, USA', 'London, UK', 'Dubai, UAE',
  'Singapore', 'Toronto, Canada', 'Sydney, Australia', 'Berlin, Germany',
  'Paris, France', 'Tokyo, Japan', 'Remote / Online',
]

interface LocationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LocationInput({ value, onChange, placeholder = 'Start typing a city...', className }: LocationInputProps) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (val: string) => {
    onChange(val)
    if (val.length >= 2) {
      const filtered = INDIAN_CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 8)
      setSuggestions(filtered)
      setOpen(filtered.length > 0)
    } else {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <Input
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (value.length >= 2) { handleChange(value) } }}
        placeholder={placeholder}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {suggestions.map(city => (
            <button
              key={city}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => { onChange(city); setOpen(false); }}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
