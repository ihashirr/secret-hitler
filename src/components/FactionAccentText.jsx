import { Fragment } from 'react';

const KEYWORD_PATTERN = /\b(Hitler(?:'s)?|fascists?|liberals?)\b/gi;

const FACTION_CLASS_MAP = {
  hitler: 'font-semibold text-red-300',
  "hitler's": 'font-semibold text-red-300',
  fascist: 'font-semibold text-red-300',
  fascists: 'font-semibold text-red-300',
  liberal: 'font-semibold text-cyan-300',
  liberals: 'font-semibold text-cyan-300',
};

export default function FactionAccentText({ as: Component = 'span', className = '', children }) {
  if (children === null || children === undefined) {
    return null;
  }

  if (typeof children !== 'string' && typeof children !== 'number') {
    return <Component className={className}>{children}</Component>;
  }

  const text = String(children);
  const parts = text.split(KEYWORD_PATTERN);

  return (
    <Component className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        const keywordClassName = FACTION_CLASS_MAP[part.toLowerCase()];

        if (!keywordClassName) {
          return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
        }

        return (
          <span key={`${part}-${index}`} className={keywordClassName}>
            {part}
          </span>
        );
      })}
    </Component>
  );
}
