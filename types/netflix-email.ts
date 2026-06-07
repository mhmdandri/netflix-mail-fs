export interface NetflixEmail {
  subject?: string;
  from?: string;
  date?: Date;
  text?: string;
  html?: string | false;
}
