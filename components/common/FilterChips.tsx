export default function FilterChips({ options, selected, onChange }: { options: string[], selected: string, onChange: (val: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 my-4">
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              isSelected 
                ? 'bg-primary text-on-primary border-primary' 
                : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-variant'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
