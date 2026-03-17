import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SkillSelector from "../../src/components/chat/SkillSelector";

const ALL_LABELS = [
  "General",
  "Features",
  "UI Bugs",
  "Sentiment",
  "SWOT",
  "Pricing",
  "Executive",
];

describe("SkillSelector", () => {
  it("renders all 7 skill pills", () => {
    render(
      <SkillSelector selectedSkill="general" onSkillChange={() => {}} />
    );
    for (const label of ALL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("highlights the selected skill", () => {
    render(
      <SkillSelector selectedSkill="general" onSkillChange={() => {}} />
    );
    const generalBtn = screen.getByText("General").closest("button");
    expect(generalBtn.className).toContain("bg-teal-100");
    expect(generalBtn.getAttribute("aria-selected")).toBe("true");
  });

  it("non-selected skills have gray styling", () => {
    render(
      <SkillSelector selectedSkill="general" onSkillChange={() => {}} />
    );
    const featuresBtn = screen.getByText("Features").closest("button");
    expect(featuresBtn.className).toContain("bg-gray-100");
    expect(featuresBtn.getAttribute("aria-selected")).toBe("false");
  });

  it("fires onSkillChange with correct key when pill is clicked", () => {
    const onSkillChange = vi.fn();
    render(
      <SkillSelector selectedSkill="general" onSkillChange={onSkillChange} />
    );

    fireEvent.click(screen.getByText("UI Bugs"));
    expect(onSkillChange).toHaveBeenCalledWith("ui_bug_detection");

    fireEvent.click(screen.getByText("SWOT"));
    expect(onSkillChange).toHaveBeenCalledWith("competitor_swot");

    fireEvent.click(screen.getByText("Executive"));
    expect(onSkillChange).toHaveBeenCalledWith("executive_summary");
  });

  it("each pill has a role of tab", () => {
    render(
      <SkillSelector selectedSkill="general" onSkillChange={() => {}} />
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(7);
  });
});
