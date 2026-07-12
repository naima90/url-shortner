// Response shapes for link endpoints.

// A single short link as the API returns it.
export interface LinkDto {
  id: string;
  code: string; // the short code or custom alias
  isCustomAlias: boolean;
  originalUrl: string;
  clickCount: number; // total clicks, computed by the API
  createdAt: string; // ISO timestamp
  expiresAt: string | null;
}

// The dashboard list of a user's links.
export interface LinkListDto {
  links: LinkDto[];
}
