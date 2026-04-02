import React from "react";
import { useNavigate } from "react-router-dom";

const ListIcon = ({ color }) => (
  <div
    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
    style={{ backgroundColor: color ?? "#6C63FF" }}
  >
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  </div>
);

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-indigo-300 hover:shadow-sm transition-all bg-white w-full"
    >
      <ListIcon color={project.color} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{project.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {project.membersCount ?? 0} member{project.membersCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
};

export default ProjectCard;
