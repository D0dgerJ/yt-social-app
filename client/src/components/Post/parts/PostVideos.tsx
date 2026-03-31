import React from 'react';
import { toAbsoluteMediaUrl } from '@/utils/mediaUrl';

interface PostVideosProps {
  videos?: string[];
}

const PostVideos: React.FC<PostVideosProps> = ({ videos = [] }) => {
  const normalizedVideos = videos
    .filter(Boolean)
    .map((video) => toAbsoluteMediaUrl(video));

  if (!normalizedVideos.length) return null;

  return (
    <div className="post-video-grid">
      {normalizedVideos.map((video, index) => (
        <video
          key={`${video}-${index}`}
          className="post-video"
          src={video}
          controls
          preload="metadata"
        />
      ))}
    </div>
  );
};

export default PostVideos;