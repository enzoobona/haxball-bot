import { ActionIcon, Box, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoonStars, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

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
      <Box lightHidden component="span" display="flex">
        <IconSun size={18} />
      </Box>
      <Box darkHidden component="span" display="flex">
        <IconMoonStars size={18} />
      </Box>
    </ActionIcon>
  );
}
