export type ExternalGifAttachment = {
  kind: "external-gif";
  url: string;
  mime: "image/gif";
  type: "gif";
  name: string;
};

export function makeGifAttachment(url: string): ExternalGifAttachment {
  return {
    kind: "external-gif",
    url,
    mime: "image/gif",
    type: "gif",
    name: `giphy-${Date.now()}.gif`,
  };
}