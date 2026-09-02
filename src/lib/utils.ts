import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Mariage",
  birthday: "Anniversaire",
  conference: "Conférence",
  ceremony: "Cérémonie",
  graduation: "Collation des grades",
  meeting: "Réunion",
  other: "Autre",
};

export const GUEST_CATEGORY_LABELS: Record<string, string> = {
  family: "Famille",
  friends: "Amis",
  colleagues: "Collègues",
  vip: "VIP",
  official: "Officiel",
  other: "Autre",
};

export const RSVP_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  declined: "Refusé",
  maybe: "Peut-être",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  active: "Actif",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  organizer: "Organisateur",
  protocol: "Protocole",
};
