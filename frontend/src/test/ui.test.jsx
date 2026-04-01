import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

describe("UI Components - Failure Cases", () => {
  describe("Button", () => {
    it("should render disabled button and not trigger onClick", () => {
      const handleClick = vi.fn();
      render(
        <Button variant="primary" onClick={handleClick} disabled>
          Submit
        </Button>
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should render all button variants without crashing", () => {
      const variants = ["primary", "secondary", "danger", "ghost"];
      variants.forEach((variant) => {
        const { unmount } = render(<Button variant={variant}>Test</Button>);
        expect(screen.getByRole("button")).toBeInTheDocument();
        unmount();
      });
    });

    it("should render button with correct text content", () => {
      render(<Button variant="primary">Click Me</Button>);
      expect(screen.getByText("Click Me")).toBeInTheDocument();
    });
  });

  describe("Input", () => {
    it("should display error message when error prop is provided", () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Input disabled placeholder="Enter value" />);
      expect(screen.getByPlaceholderText("Enter value")).toBeDisabled();
    });

    it("should not show error paragraph when no error prop", () => {
      render(<Input placeholder="Enter value" />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});
