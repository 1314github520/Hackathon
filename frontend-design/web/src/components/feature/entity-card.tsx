import Link from "next/link";

import { CoverImage } from "@/components/ui/cover-image";
import type { Aircraft, EventItem, PersonItem, SearchItem } from "@/types/api";
import { Badge } from "@/components/ui/panel";

type EntityCardProps = {
  item: Aircraft | EventItem | PersonItem | SearchItem;
  href: string;
  meta?: string[];
};

export function EntityCard({ item, href, meta = [] }: EntityCardProps) {
  const title = "nameZh" in item ? item.nameZh : item.title;
  const summary = "summary" in item ? item.summary : "";
  const coverImage = "coverImage" in item ? item.coverImage : "";
  const badgeLabel =
    "aircraftType" in item
      ? item.aircraftType
      : "eventType" in item
        ? item.eventType
        : "personType" in item
          ? item.personType
          : item.entityType;

  return (
    <article className="rounded-[1.25rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-[0_18px_35px_rgba(0,0,0,0.18)]">
      <CoverImage
        src={coverImage}
        alt={title}
        label={badgeLabel}
        className="mb-4 aspect-[16/10]"
      />
      <div className="mb-3 flex items-start justify-between gap-3">
        <Badge>{badgeLabel}</Badge>
        <Link href={href} className="text-sm text-[var(--brand)] underline-offset-4 hover:underline">
          查看详情
        </Link>
      </div>
      <h4 className="text-xl font-semibold tracking-[-0.02em]">{title}</h4>
      <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--muted)]">{summary}</p>
      {meta.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {meta.map((entry) => (
            <span
              key={entry}
              className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs text-[var(--muted)]"
            >
              {entry}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
