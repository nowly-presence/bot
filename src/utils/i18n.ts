import { Locale } from "#/types/locale";

type Messages = Record<string, string | Record<string, any>>;
type Replacements = Record<string, string | number>;

const messages: Record<Locale, Messages> = {
  en: {
    genericError: "Something went wrong.",
    unknown: "Unknown",
    presenceNotFound: "No Nowly presence found for `{query}`.",
    presenceNoDescription: "No description available.",
    presenceFooter: "By {author}",
    openPresence: "Open presence",
    openLibrary: "Open library",
    openStatus: "Open status",
    supportTitle: "Nowly support",
    supportDescription: "Need help with Nowly, the extension, or a presence? Open the support page and include as much context as possible.",
    openSupport: "Open support",
    linksTitle: "Nowly links",
    linksDescription: "Useful Nowly pages.",
    website: "Website",
    statusTitle: "Nowly status",
    statusServiceLine: "{status}\nHTTP {httpStatus} - {responseMs}",
    langGuildOnly: "Server language can only be changed inside a server.",
    langMissingPermission: "You need the Manage Server permission to change the server language.",
    langGuildUpdated: "Server language updated to English.",
    langUserUpdated: "Your language has been updated to English.",
    statusStates: {
      operational: "Operational",
      slow: "Slow",
      degraded: "Degraded",
      down: "Down",
      unknown: "Unknown",
    },
    statusOverall: {
      operational: "All monitored services are operational.",
      slow: "Some services are slower than usual.",
      degraded: "Some services are degraded.",
      down: "At least one monitored service is down.",
      unknown: "No recent status sample is available.",
    },
    services: {
      website: "Website",
      api: "API",
      library: "Library",
      cdn: "CDN",
    },
    presenceFields: {
      slug: "Slug",
      version: "Version",
      category: "Category",
      installs: "Installs",
      activeUsers: "Active users",
      rating: "Rating",
    },
  },
  fr: {
    genericError: "Une erreur est survenue.",
    unknown: "Inconnu",
    presenceNotFound: "Aucune presence Nowly trouvee pour `{query}`.",
    presenceNoDescription: "Aucune description disponible.",
    presenceFooter: "Par {author}",
    openPresence: "Ouvrir la presence",
    openLibrary: "Ouvrir la bibliotheque",
    openStatus: "Ouvrir le statut",
    supportTitle: "Support Nowly",
    supportDescription: "Besoin d'aide avec Nowly, l'extension ou une presence ? Ouvre la page support et ajoute le plus de contexte possible.",
    openSupport: "Ouvrir le support",
    linksTitle: "Liens Nowly",
    linksDescription: "Pages Nowly utiles.",
    website: "Site web",
    statusTitle: "Statut Nowly",
    statusServiceLine: "{status}\nHTTP {httpStatus} - {responseMs}",
    langGuildOnly: "La langue serveur ne peut etre modifiee que dans un serveur.",
    langMissingPermission: "Tu dois avoir la permission Gerer le serveur pour changer la langue du serveur.",
    langGuildUpdated: "La langue du serveur est maintenant le francais.",
    langUserUpdated: "Ta langue est maintenant le francais.",
    statusStates: {
      operational: "Operationnel",
      slow: "Lent",
      degraded: "Degrade",
      down: "Indisponible",
      unknown: "Inconnu",
    },
    statusOverall: {
      operational: "Tous les services surveilles sont operationnels.",
      slow: "Certains services sont plus lents que d'habitude.",
      degraded: "Certains services sont degrades.",
      down: "Au moins un service surveille est indisponible.",
      unknown: "Aucun releve recent n'est disponible.",
    },
    services: {
      website: "Site web",
      api: "API",
      library: "Bibliotheque",
      cdn: "CDN",
    },
    presenceFields: {
      slug: "Identifiant",
      version: "Version",
      category: "Categorie",
      installs: "Installations",
      activeUsers: "Utilisateurs actifs",
      rating: "Note",
    },
  },
};

export const t = (
  locale: Locale,
  key: string,
  replacements: Replacements = {},
): string => {
  const value = key.split(".").reduce<any>((current, part) => current?.[part], messages[locale])
    ?? key.split(".").reduce<any>((current, part) => current?.[part], messages.en);

  if (typeof value !== "string") {
    return key;
  }

  return Object.entries(replacements).reduce((message, [name, replacement]) => {
    return message.replaceAll(`{${name}}`, String(replacement));
  }, value);
};
