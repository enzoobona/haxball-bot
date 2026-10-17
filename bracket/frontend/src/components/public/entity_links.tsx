import { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import classes from './entity_links.module.css';

// Links a las páginas públicas de un equipo o jugador. El torneo se toma de la URL actual
// (`/tournaments/:id/dashboard/...`), así que funcionan en cualquier pantalla pública.
function useDashboardBase() {
  const { id } = useParams();
  return `/tournaments/${id}/dashboard`;
}

export function TeamLink({ teamId, children }: { teamId?: number | null; children: ReactNode }) {
  const base = useDashboardBase();
  if (teamId == null) return <>{children}</>;
  return (
    <Link to={`${base}/teams/${teamId}`} className={classes.link}>
      {children}
    </Link>
  );
}

export function PlayerLink({
  playerId,
  children,
}: {
  playerId?: number | null;
  children: ReactNode;
}) {
  const base = useDashboardBase();
  if (playerId == null) return <>{children}</>;
  return (
    <Link to={`${base}/stats/players/${playerId}`} className={classes.link}>
      {children}
    </Link>
  );
}
