export const API_URL = import.meta.env.VITE_API_URL;

export const USER_ROLES = {
  USER: "user",
  WRITER: "writer",
  ADMIN: "admin",
  OWNER: "owner",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
