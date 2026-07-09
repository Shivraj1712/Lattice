import { Project, User } from "./api";

export interface ExtendedProfile {
  name: string;
  email: string;
  avatar: string | null;
  username: string;
  portfolio: string;
  github: string;
  linkedin: string;
}

// Map actual user IDs in backend database to their registered emails
export const USER_ID_TO_EMAIL: Record<string, string> = {
  "8fa6d77b-54e6-4f1f-8d06-2b764db19bcd": "shivrajmaharaul688@gmail.com",
  "0f2ad39c-b064-423a-b83b-9441781628da": "2403051051188@paruluniversity.ac.in",
  "6b1dce4b-a0bc-4be0-b0b9-b79ea3c072df": "nikunjsorathiya712@gmail.com"
};

export function resolveOwnerDetails(project: Project, currentUser?: User | null) {
  let userId = project.user_id;
  let name = project.user?.name || "";
  let email = project.user?.email || "";
  let avatar = project.user?.avatar_url || null;

  // Map to the actual email if user_id exists in registry mapping
  if (userId && USER_ID_TO_EMAIL[userId]) {
    email = USER_ID_TO_EMAIL[userId] || email;
  }

  // If this is the current user, use their real session info
  if (currentUser && (userId === currentUser.user_id || email === currentUser.email)) {
    userId = currentUser.user_id;
    name = currentUser.name || name;
    email = currentUser.email || email;
    avatar = currentUser.avatar_url || avatar;
  }

  // Fallback to name extraction if name is empty
  if (!name && email) {
    const handle = email.split("@")[0] || "developer";
    name = handle.charAt(0).toUpperCase() + handle.slice(1);
  }

  return { userId, name, email, avatar };
}
