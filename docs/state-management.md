# State Management

## Library: Redux Toolkit

This project uses Redux Toolkit (RTK) for global state management.

## Rule: What Goes in the Store

| Data Type | Where it lives | Why |
|-----------|---------------|-----|
| Authenticated user, session token | Redux store | Needed across many unrelated components |
| Global theme, locale | Redux store | App-wide setting |
| Global notification count | Redux store | Shared across header + notification panel |
| Page-specific list data | `useState` in page component | Only needed by one page |
| Form state | `useState` or `react-hook-form` | Local, ephemeral |
| Filters, pagination per page | `useState` in page component | Not shared globally |

## Store Structure

```
store/
  index.js           ← configureStore with all reducers
  hooks.js           ← useAppDispatch, useAppSelector
  slices/
    authSlice.js     ← user, token, isLoading, error
    appSlice.js      ← theme, notifications, isGlobalLoading
```

## API Call Routing

```js
// ✅ Global data → via store action
dispatch(loginUser(credentials));  // createAsyncThunk

// ✅ Page data → via service in page component
const [tasks, setTasks] = useState([]);
useEffect(() => {
  taskService.getAll(token).then(res => setTasks(res.data));
}, []);

// ❌ Forbidden — direct API call in component
const res = await axios.get("/api/tasks");  // bypass service layer

// ❌ Forbidden — page data in store
dispatch(setTasks(tasks));  // tasks are page-specific, not global
```

## createAsyncThunk Pattern

```js
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Login failed");
    }
  }
);
```

## Reading State

```js
// ✅ Use useAppSelector hook
import { useAppSelector } from "@/store/hooks";
const user = useAppSelector((state) => state.auth.user);

// ✅ Or use feature hook
import useAuth from "@/hooks/useAuth";
const { user, token, isLoading } = useAuth();
```

## Prohibited Patterns

- Mixing Redux + Zustand
- Using React Context API for global state
- Calling APIs directly inside components (always go through service layer)
- Putting page-specific data into Redux slices
