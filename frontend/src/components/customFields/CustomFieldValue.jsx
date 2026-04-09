import { useCallback, useRef, useState } from "react";

// Debounce hook
const useDebounce = (fn, delay) => {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
};

const formatDateValue = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

const AVATAR_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F97316", "#22C55E", "#3B82F6"];
const getAvatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// ─── UserFieldSelect ──────────────────────────────────────────────────────────

const UserFieldSelect = ({ value, projectMembers, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const currentUserId = value?.valueUserId ?? null;
  const selectedMember = projectMembers.find((m) => m.userId === currentUserId);
  const filtered = projectMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
        className="w-full flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
      >
        {selectedMember ? (
          <>
            {selectedMember.avatarUrl ? (
              <img src={selectedMember.avatarUrl} alt="" className="w-5 h-5 rounded-full shrink-0 object-cover" />
            ) : (
              <span
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: getAvatarColor(selectedMember.name) }}
              >
                {getInitials(selectedMember.name)}
              </span>
            )}
            <span className="text-gray-800 truncate">{selectedMember.name}</span>
          </>
        ) : (
          <span className="text-gray-400">—</span>
        )}
        <svg className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-full min-w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
            <div className="px-2 py-1.5 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="w-full text-xs px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {currentUserId && (
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
              >
                — Clear
              </button>
            )}
            {filtered.map((m) => (
              <button
                key={m.userId}
                onClick={() => { onChange(m.userId); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50
                  ${currentUserId === m.userId ? "bg-indigo-50 text-indigo-700" : "text-gray-700"}`}
              >
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full shrink-0 object-cover" />
                ) : (
                  <span
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: getAvatarColor(m.name) }}
                  >
                    {getInitials(m.name)}
                  </span>
                )}
                <span className="truncate">{m.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No members found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * CustomFieldValue — controlled component.
 * Parent owns `value` state and provides `onChange(valueData)`.
 *
 * Props:
 *   field      — { id, name, type, options, isRequired }
 *   value      — the current customFieldValues row (may be null/undefined)
 *   onChange   — (fieldId, valueData) => void — called debounced on change
 *   projectMembers — array of { userId, name, avatarUrl } for user fields
 */
const CustomFieldValue = ({ field, value, onChange, projectMembers = [] }) => {
  const debouncedChange = useDebounce((fieldId, valueData) => {
    onChange(fieldId, valueData);
  }, 600);

  const baseInputClass =
    "w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          defaultValue={value?.valueText ?? ""}
          placeholder="—"
          className={baseInputClass}
          onChange={(e) => debouncedChange(field.id, { valueText: e.target.value || null })}
        />
      );

    case "number":
      return (
        <input
          type="number"
          defaultValue={value?.valueNumber ?? ""}
          placeholder="—"
          className={baseInputClass}
          onChange={(e) =>
            debouncedChange(field.id, {
              valueNumber: e.target.value !== "" ? Number(e.target.value) : null,
            })
          }
        />
      );

    case "date":
      return (
        <input
          type="date"
          defaultValue={formatDateValue(value?.valueDate)}
          className={baseInputClass}
          onChange={(e) =>
            debouncedChange(field.id, {
              valueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />
      );

    case "dropdown": {
      const options = field.options ?? field.fieldOptions ?? [];
      const currentOption = options.find((o) => o.value === value?.valueOption);
      return (
        <div className="relative">
          <select
            defaultValue={value?.valueOption ?? ""}
            className={baseInputClass}
            onChange={(e) =>
              debouncedChange(field.id, { valueOption: e.target.value || null })
            }
          >
            <option value="">—</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
          {currentOption?.color && (
            <span
              className="absolute right-7 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: currentOption.color }}
            />
          )}
        </div>
      );
    }

    case "user": {
      return (
        <UserFieldSelect
          field={field}
          value={value}
          projectMembers={projectMembers}
          onChange={(userId) => onChange(field.id, { valueUserId: userId })}
        />
      );
    }

    default:
      return <span className="text-sm text-gray-400">—</span>;
  }
};

export default CustomFieldValue;
