import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logoutUser, clearError } from "@/store/slices/authSlice";

const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });

describe("Auth - Failure Cases", () => {
  it("should display error when auth has an error message", () => {
    const store = createTestStore({
      auth: { user: null, token: null, isLoading: false, error: "Invalid credentials" },
    });

    const TestComponent = () => {
      const error = store.getState().auth.error;
      return <div>{error && <span data-testid="error">{error}</span>}</div>;
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId("error")).toHaveTextContent("Invalid credentials");
  });

  it("should show loading state during authentication", () => {
    const store = createTestStore({
      auth: { user: null, token: null, isLoading: true, error: null },
    });

    const TestComponent = () => {
      const isLoading = store.getState().auth.isLoading;
      return <div>{isLoading && <span data-testid="loading">Loading...</span>}</div>;
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should have null user and token when not authenticated", () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
    expect(state.auth.isLoading).toBe(false);
    expect(state.auth.error).toBeNull();
  });

  it("should clear user and token after logout", () => {
    const store = createTestStore({
      auth: {
        user: { id: "1", email: "test@example.com" },
        token: "some-token",
        isLoading: false,
        error: null,
      },
    });

    store.dispatch(logoutUser());
    const state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
  });

  it("should clear error after clearError action", () => {
    const store = createTestStore({
      auth: { user: null, token: null, isLoading: false, error: "Some error" },
    });

    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});
