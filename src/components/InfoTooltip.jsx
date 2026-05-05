import { useState } from 'react'

export default function InfoTooltip({ text, children }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(s => !s)}
    >
      {children || (
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-pointer select-none"
          style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
        >
          i
        </span>
      )}
      {show && (
        <span
          className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-line shadow-lg pointer-events-none"
          style={{
            backgroundColor: '#1F2937',
            color: 'white',
            minWidth: 240,
            maxWidth: 320,
          }}
        >
          {text}
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ backgroundColor: '#1F2937' }}
          />
        </span>
      )}
    </span>
  )
}
