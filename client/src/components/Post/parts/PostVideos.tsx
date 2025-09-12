import React from "react";

const PostVideos: React.FC<{ videos?: string[]; className?: string }> = ({
  videos,
  className = "post-video",
}) => {
  if (!videos?.length) return null;
  return (
    <>
      {videos.map((url, idx) => (
        <video key={idx} controls className={className}>
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ))}
    </>
  );
};

export default PostVideos;
