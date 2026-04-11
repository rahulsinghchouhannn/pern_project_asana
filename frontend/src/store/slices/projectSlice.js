import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "@/services/projectService";

// ─── Async thunks ──────────────────────────────────────────────────────────────

export const fetchOrgProjects = createAsyncThunk(
  "projects/fetchOrg",
  async (_, { rejectWithValue }) => {
    try {
      const res = await projectService.getOrgProjects();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load projects");
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await projectService.createProject(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to create project");
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await projectService.getProjectById(projectId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load project");
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/update",
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      const res = await projectService.updateProject(projectId, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update project");
    }
  }
);

/** Maps `archiveProject` rejection (from unwrap) to user-facing toast copy. */
export const getArchiveErrorToastMessage = (rejectedValue) => {
  const status =
    typeof rejectedValue === "object" && rejectedValue !== null
      ? rejectedValue.status
      : undefined;
  const message =
    typeof rejectedValue === "string"
      ? rejectedValue
      : rejectedValue?.message;
  if (status === 403 || message === "Insufficient permissions") {
    return "You don't have permission to archive this project.";
  }
  return "Failed to archive project.";
};

/** POST /archive — updates local state from response (no follow-up PUT; avoids update_project requirement). */
export const archiveProject = createAsyncThunk(
  "projects/archive",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await projectService.archiveProject(projectId);
      return res.data.data;
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.error ||
        (typeof err.message === "string" ? err.message : null) ||
        "Failed to archive project";
      return rejectWithValue({ message, status });
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to delete project");
    }
  }
);

export const fetchProjectMembers = createAsyncThunk(
  "projects/fetchMembers",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await projectService.getMembers(projectId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load members");
    }
  }
);

export const fetchProjectStatuses = createAsyncThunk(
  "projects/fetchStatuses",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await projectService.getStatuses(projectId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load statuses");
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const projectSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    currentProject: null,
    members: [],
    statuses: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.members = [];
      state.statuses = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchOrgProjects
    builder
      .addCase(fetchOrgProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrgProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchOrgProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createProject
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchProjectById
    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
        state.statuses = action.payload.statuses ?? [];
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // updateProject
    builder.addCase(updateProject.fulfilled, (state, action) => {
      state.currentProject = { ...state.currentProject, ...action.payload };
      const idx = state.projects.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.projects[idx] = { ...state.projects[idx], ...action.payload };
    });

    // archiveProject
    builder.addCase(archiveProject.fulfilled, (state, action) => {
      const p = action.payload;
      if (!p?.id) return;
      if (state.currentProject?.id === p.id) {
        state.currentProject = { ...state.currentProject, ...p };
      }
      const idx = state.projects.findIndex((proj) => proj.id === p.id);
      if (idx !== -1) state.projects[idx] = { ...state.projects[idx], ...p };
    });

    // deleteProject
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) state.currentProject = null;
    });

    // fetchProjectMembers
    builder.addCase(fetchProjectMembers.fulfilled, (state, action) => {
      state.members = action.payload;
    });

    // fetchProjectStatuses
    builder.addCase(fetchProjectStatuses.fulfilled, (state, action) => {
      state.statuses = action.payload;
    });
  },
});

export const { clearCurrentProject, clearError } = projectSlice.actions;
export default projectSlice.reducer;
