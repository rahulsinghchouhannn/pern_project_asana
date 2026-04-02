import React, { useCallback, useRef } from "react";

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
      const currentUserId = value?.valueUserId ?? "";
      return (
        <select
          defaultValue={currentUserId}
          className={baseInputClass}
          onChange={(e) =>
            debouncedChange(field.id, { valueUserId: e.target.value || null })
          }
        >
          <option value="">—</option>
          {projectMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      );
    }

    default:
      return <span className="text-sm text-gray-400">—</span>;
  }
};

export default CustomFieldValue;
