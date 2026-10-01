import type { Family } from "@/lib/types"

type FamilyNotesProps = {
  family: Family
  showName?: boolean
}

export function FamilyNotes({ family, showName = false }: FamilyNotesProps) {
  return (
    <section className="border border-rule bg-paper px-4 py-3 text-[12px] leading-relaxed">
      {showName ? (
        <h2 className="font-serif text-[1.5rem] leading-tight text-ink">{family.name}</h2>
      ) : null}
      <p className={showName ? "mt-1 text-ink" : "text-ink"}>{family.definition}</p>
      <p className="mt-3 text-ink-soft">
        <span className="uppercase tracking-[0.06em] text-accent">Always </span>
        {family.always.join(" ")}
      </p>
      <p className="mt-2 text-ink-soft">
        <span className="uppercase tracking-[0.06em] text-accent">Never </span>
        {family.never.join(" ")}
      </p>
    </section>
  )
}
