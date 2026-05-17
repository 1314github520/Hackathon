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
    <article className="entity-card">
      <CoverImage
        src={coverImage}
        alt={title}
        label={badgeLabel}
        className="mb-4 aspect-[16/10]"
      />
      <div className="entity-card-head">
        <Badge>{badgeLabel}</Badge>
        <Link href={href} className="entity-card-link" aria-label={`查看${title}详情`}>
          查看详情
        </Link>
      </div>
      <h4 className="entity-card-title">{title}</h4>
      <p className="entity-card-summary">{summary}</p>
      {meta.length > 0 ? (
        <div className="entity-card-meta">
          {meta.map((entry) => (
            <span key={entry} className="entity-card-chip">
              {entry}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
