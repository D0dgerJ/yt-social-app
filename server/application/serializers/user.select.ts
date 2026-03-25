export const publicUserSelect = {
  id: true,
  username: true,
  profilePicture: true,
  coverPicture: true,
  desc: true,
  from: true,
  city: true,
  relationship: true,
} as const;

export const privateUserSelect = {
  ...publicUserSelect,
  email: true,
  role: true,
} as const;