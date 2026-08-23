import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Avatar from "@/components/ui/Avatar";

describe("Avatar Component", () => {
  it("renders user initials correctly", () => {
    render(<Avatar name="Alice Johnson" color="#6366f1" size="md" />);
    expect(screen.getByText("AJ")).toBeInTheDocument();
  });

  it("applies the custom background color", () => {
    const { container } = render(<Avatar name="Bob Smith" color="#ec4899" size="md" />);
    const badge = container.querySelector(".avatar-badge");
    expect(badge).toHaveStyle({ backgroundColor: "#ec4899" });
  });

  it("handles empty or single-word names gracefully", () => {
    render(<Avatar name="Charlie" color="#f59e0b" size="sm" />);
    expect(screen.getByText("CH")).toBeInTheDocument();
  });
});
