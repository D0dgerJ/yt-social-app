import React from 'react';
import { toAbsoluteMediaUrl } from '@/utils/mediaUrl';

interface PostGalleryProps {
  images?: string[];
  gridClassName?: string;
  imgClassName?: string;
  emptyClassName?: string;
  emptyText?: string;
  showEmpty?: boolean;
}

const PostGallery: React.FC<PostGalleryProps> = ({
  images = [],
  gridClassName = '',
  imgClassName = '',
  emptyClassName = '',
  emptyText = 'No images',
  showEmpty = false,
}) => {
  const normalizedImages = images
    .filter(Boolean)
    .map((img) => toAbsoluteMediaUrl(img));

  if (!normalizedImages.length) {
    return showEmpty ? <div className={emptyClassName}>{emptyText}</div> : null;
  }

  return (
    <div className={gridClassName}>
      {normalizedImages.map((img, index) => (
        <img
          key={`${img}-${index}`}
          src={img}
          alt={`Post image ${index + 1}`}
          className={imgClassName}
          loading="lazy"
        />
      ))}
    </div>
  );
};

export default PostGallery;