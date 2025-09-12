import React, { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type Props = {
  images?: string[];
  gridClassName?: string;
  imgClassName?: string;
  emptyClassName?: string;
  emptyText?: string;
  showEmpty?: boolean;
};

const PostGallery: React.FC<Props> = ({
  images,
  gridClassName = "post-image-grid",
  imgClassName = "post-image-thumb",
  emptyClassName = "modal-no-image",
  emptyText = "No images",
  showEmpty = false,
}) => {
  const imgs = images ?? [];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (!imgs.length) {
    return showEmpty ? <div className={emptyClassName}>{emptyText}</div> : null;
  }

  return (
    <>
      <div className={gridClassName}>
        {imgs.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Post image ${i + 1}`}
            className={imgClassName}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            loading="lazy"
          />
        ))}
      </div>

      {open && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          slides={imgs.map((src) => ({ src }))}
          index={index}
          on={{ view: ({ index }) => setIndex(index) }}
          plugins={[Thumbnails]}
        />
      )}
    </>
  );
};

export default PostGallery;
