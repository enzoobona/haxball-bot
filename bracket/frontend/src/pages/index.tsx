import { Grid, Select, Title } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import TournamentsCardTable from '@components/card_tables/tournaments';
import TournamentModal from '@components/modals/tournament_modal';
import { TournamentFilter } from '@components/utils/tournament';
import { capitalize } from '@components/utils/util';
import { checkForAuthError, getTournaments } from '@services/adapter';
import { isAdminSession } from '@services/local_storage';
import Layout from './_layout';
import classes from './index.module.css';
import PublicHomePage from './public_home';

function AdminHomePage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TournamentFilter>('OPEN');

  const swrTournamentsResponse = getTournaments(filter);
  checkForAuthError(swrTournamentsResponse);

  return (
    <Layout>
      <Grid>
        <Grid.Col span="auto">
          <Title>{capitalize(t('tournaments_title'))}</Title>
        </Grid.Col>
        <Grid.Col span="content" className={classes.fullWithMobile}>
          <Select
            size="md"
            placeholder={t('pick_value_placeholder')}
            data={[
              { label: t('filter_all'), value: 'ALL' },
              { label: t('filter_archived'), value: 'ARCHIVED' },
              { label: t('filter_open'), value: 'OPEN' },
            ]}
            allowDeselect={false}
            value={filter}
            // @ts-ignore
            onChange={(f: TournamentFilter) => setFilter(f)}
          />
        </Grid.Col>
        <Grid.Col span="content" className={classes.fullWithMobile}>
          <TournamentModal swrTournamentsResponse={swrTournamentsResponse} />
        </Grid.Col>
      </Grid>
      <TournamentsCardTable swrTournamentsResponse={swrTournamentsResponse} />
    </Layout>
  );
}

// Quien no es administrador (visitantes y jugadores con cuenta) ve la portada pública; el
// organizador (ADMIN) ve su panel.
export default function HomePage() {
  return isAdminSession() ? <AdminHomePage /> : <PublicHomePage />;
}
