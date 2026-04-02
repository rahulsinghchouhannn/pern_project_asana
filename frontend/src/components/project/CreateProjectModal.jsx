import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createProject } from "@/store/slices/projectSlice";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const COLOR_SWATCHES = [
  "#6C63FF",
  "#F87171",
  "#FBBF24",
  "#34D399",
  "#60A5FA",
  "#F472B6",
  "#A78BFA",
  "#2DD4BF",
];

const VIEW_OPTIONS = [
  { value: "list",     label: "List",     icon: "☰" },
  { value: "board",    label: "Board",    icon: "⊞" },
  { value: "timeline", label: "Timeline", icon: "▬" },
  { value: "calendar", label: "Calendar", icon: "▦" },
];

const CreateProjectModal = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((s) => s.projects);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [defaultView, setDefaultView] = useState("list");
  const [nameError, setNameError] = useState("");

  const reset = () => {
    setName("");
    setDescription("");
    setColor(COLOR_SWATCHES[0]);
    setIsPrivate(false);
    setDefaultView("list");
    setNameError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Project name is required");
      return;
    }

    const result = await dispatch(
      createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        isPrivate,
        defaultView,
      })
    );

    if (createProject.fulfilled.match(result)) {
      const projectId = result.payload.id;
      reset();
      onClose();
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create project">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="project-name"
          label="Project name"
          placeholder="My awesome project"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError("");
          }}
          error={nameError}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Description
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Color swatches */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                  color === c ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Private project</p>
            <p className="text-xs text-gray-400">Only visible to members</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={() => setIsPrivate((v) => !v)}
            className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
              isPrivate ? "bg-indigo-600" : "bg-gray-200"
            }`}
            style={{ height: "22px", width: "40px" }}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPrivate ? "translate-x-[18px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Default view selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Default view</label>
          <div className="grid grid-cols-4 gap-2">
            {VIEW_OPTIONS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setDefaultView(v.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                  defaultView === v.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-base">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
