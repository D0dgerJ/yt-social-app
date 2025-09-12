import React from "react";
import { Link } from "react-router-dom";

type Props = {
  tags?: string[];
  className?: string;
};

const PostTags: React.FC<Props> = ({ tags, className = "post-tags" }) => {
  if (!tags?.length) return null;
  return (
    <div className={className}>
      {tags.map((tag, i) => (
        <Link
          to={`/tags/${encodeURIComponent(tag)}`}
          key={`${tag}-${i}`}
          className="post-tag"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
};

export default PostTags;
