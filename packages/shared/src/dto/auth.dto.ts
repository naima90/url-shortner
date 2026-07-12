// Response shapes for auth endpoints.
// These describe what the API sends back, so the frontend knows exactly what to
// expect. Request shapes live in schemas/auth.schema.ts.

// The safe, public view of a user. Note there is no passwordHash here: we never
// send that to the client.
export interface UserDto {
  id: string;
  email: string;
  createdAt: string; // ISO timestamp
}

// What /api/auth/register and /api/auth/login return on success.
// The tokens themselves are set as httpOnly cookies, so the body only needs
// to carry the user record for the UI to show who is logged in.
export interface AuthResponseDto {
  user: UserDto;
}
