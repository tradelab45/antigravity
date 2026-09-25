import React from 'react';

export interface SkipTarget {
  /** The id on the element to jump to. It needs tabIndex={-1} to take focus. */
  id: string;
  label: string;
}

interface SectionSkipLinksProps {
  /** Names the set of links for a screen reader, e.g. "Skip within the Academy". */
  label: string;
  targets: SkipTarget[];
}

/**
 * Jumps past a long column to the part of the view somebody actually wants.
 *
 * The app has one skip link, to the start of the main content, and that is
 * where it stops helping: the Academy puts a list of every lesson before the
 * lesson, so reaching the reader by keyboard means tabbing through dozens of
 * links, every time. These sit at the top of such a view, invisible until one
 * of them takes focus, exactly like the existing skip link.
 *
 * The targets carry tabIndex={-1} so the browser moves focus to them rather
 * than only scrolling — a scroll that leaves focus behind moves the page for
 * a sighted keyboard user and nothing at all for a screen reader.
 */
export const SectionSkipLinks: React.FC<SectionSkipLinksProps> = ({ label, targets }) => {
  if (targets.length === 0) return null;

  return (
    <nav aria-label={label}>
      {targets.map((target, index) => (
        <a
          key={target.id}
          href={`#${target.id}`}
          className="skip-link"
          // Stacked below the page's own skip link, and below each other, so
          // tabbing from the top reveals them one at a time in their order
          // rather than in one spot.
          style={{ top: `${4.5 + index * 3.5}rem` }}
        >
          {target.label}
        </a>
      ))}
    </nav>
  );
};

export default SectionSkipLinks;
