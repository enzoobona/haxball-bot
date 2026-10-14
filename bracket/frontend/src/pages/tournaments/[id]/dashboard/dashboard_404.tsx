import { Button, Container, Group, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import PreloadLink from '@components/utils/link';
import classes from '@pages/404.module.css';

export default function DashboardNotFoundPage() {
  const { t } = useTranslation();

  return (
    <Container className={classes.root}>
      <div className={classes.label}>404</div>
      <Title className={classes.title}> {t('not_found_title')}</Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        {t('not_found_description')}
      </Text>
      <Group justify="center">
        <Button component={PreloadLink} href="/" variant="subtle" size="md">
          {t('back_to_site')}
        </Button>
      </Group>
    </Container>
  );
}
