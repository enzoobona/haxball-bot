import { ActionIcon, Box, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoonStars, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import classes from './color_scheme_toggle.module.css';

export function ColorSchemeToggle({ size = 36 }: { size?: number }) {
  const { t } = useTranslation();
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('dark', { getInitialValueInEffect: true });
  const label = t('toggle_color_scheme');

  return (
    <ActionIcon
      variant="default"
      size={size}
      aria-label={label}
      title={label}
      onClick={() => setColorScheme(computed === 'light' ? 'dark' : 'light')}
    >
      {/* Sin `display` inline: pisaba lightHidden/darkHidden y se veían los dos íconos. */}
      <Box lightHidden component="span" className={classes.icon}>
        <IconSun size={18} />
      </Box>
      <Box darkHidden component="span" className={classes.icon}>
        <IconMoonStars size={18} />
      </Box>
    </ActionIcon>
  );
}
