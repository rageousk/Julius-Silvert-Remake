"use client";

import { CATEGORY_NAMES, CategoryName } from "@/lib/types";

type Props = {
  selected: CategoryName | "All";
  onSelect: (category: CategoryName | "All") => void;
};

export function CategoryGrid({ selected, onSelect }: Props) {
  return (
    <section className="coded-category-nav">
      <h2 className="section-title">Shop by Department</h2>
      <p className="section-subtitle">
        Fully coded category navigation under the header, styled to match your live-site structure.
      </p>
      <div className="category-chip-row">
        <button
          className={`category-chip ${selected === "All" ? "active" : ""}`}
          onClick={() => onSelect("All")}
          aria-pressed={selected === "All"}
        >
          All Departments
        </button>
        {CATEGORY_NAMES.map((category) => (
          <button
            key={category}
            className={`category-chip ${selected === category ? "active" : ""}`}
            onClick={() => onSelect(category)}
            aria-pressed={selected === category}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}
