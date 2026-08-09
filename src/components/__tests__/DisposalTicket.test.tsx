import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DisposalTicket } from "@/components/DisposalTicket";
import type { ScanTicket } from "@/lib/types";

const baseTicket: ScanTicket = {
  id: "test",
  timestamp: new Date("2026-01-01T12:00:00"),
  image: null,
  guidance: "Follow the disposal guidance.",
  disposalRoute: "General Trash",
  bin: "Gray Bin (Trash)",
  itemName: "Wrapper"
};

describe("DisposalTicket", () => {
  it("does not offer a location search for a non-searchable route", () => {
    render(<DisposalTicket ticket={baseTicket} />);
    expect(screen.queryByRole("link", { name: /find nearby/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /scan again/i })).toBeInTheDocument();
  });

  it("offers a location search for special drop-off routes", () => {
    render(
      <DisposalTicket
        ticket={{
          ...baseTicket,
          disposalRoute: "E-Waste",
          bin: "Special Drop-off",
          itemName: "Cable"
        }}
      />
    );
    expect(screen.getByRole("link", { name: /find nearby/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/locations")
    );
  });
});
