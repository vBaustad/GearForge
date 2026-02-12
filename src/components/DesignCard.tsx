import Link from "next/link";
import Image from "next/image";
import { Heart, Eye } from "lucide-react";
import type { CreationWithCreator, Category } from "@/types/creation";
import { CATEGORY_LABELS } from "@/types/creation";
import type { Id } from "../../convex/_generated/dataModel";

// Support both full object and individual props
interface DesignCardObjectProps {
  creation: CreationWithCreator;
}

interface DesignCardPropsProps {
  id: Id<"creations">;
  title: string;
  thumbnailUrl: string | null;
  category: string;
  creatorName: string;
  likeCount: number;
  viewCount?: number;
}

type DesignCardProps = DesignCardObjectProps | DesignCardPropsProps;

function isObjectProps(props: DesignCardProps): props is DesignCardObjectProps {
  return "creation" in props;
}

export function DesignCard(props: DesignCardProps) {

  // Normalize data from either props format
  const data = isObjectProps(props)
    ? {
        id: props.creation._id,
        title: props.creation.title,
        thumbnailUrl: props.creation.thumbnailUrl,
        category: props.creation.category as Category,
        creatorName: props.creation.creatorName,
        likeCount: props.creation.likeCount,
        viewCount: props.creation.viewCount,
      }
    : {
        id: props.id,
        title: props.title,
        thumbnailUrl: props.thumbnailUrl,
        category: props.category as Category,
        creatorName: props.creatorName,
        likeCount: props.likeCount,
        viewCount: props.viewCount ?? 0,
      };
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <Link
      href={`/design/${data.id}`}
      className="design-card"
    >
      {/* Thumbnail with lazy loading */}
      <div className="design-card-image">
        {data.thumbnailUrl ? (
          <Image
            src={data.thumbnailUrl}
            alt={data.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="design-card-placeholder">
            <Image
              src="/gearforge_logo_new.png"
              alt=""
              width={64}
              height={64}
              className="placeholder-logo"
            />
          </div>
        )}
        {/* Category badge overlay */}
        <span className="design-card-badge">
          {CATEGORY_LABELS[data.category]}
        </span>
      </div>

      {/* Content */}
      <div className="design-card-content">
        <h3 className="design-card-title">{data.title}</h3>
        <p className="design-card-creator">by {data.creatorName}</p>

        {/* Stats */}
        <div className="design-card-stats">
          <span>
            <Heart size={14} />
            {formatNumber(data.likeCount)}
          </span>
          <span>
            <Eye size={14} />
            {formatNumber(data.viewCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
