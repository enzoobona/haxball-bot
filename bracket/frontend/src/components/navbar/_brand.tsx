import { Center, Group, Image, Text, Title, UnstyledButton } from '@mantine/core';

import PreloadLink from '@components/utils/link';
import { SITE_NAME } from '../../config';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Center mr="md">
      <UnstyledButton component={PreloadLink} href={href}>
        <Group gap="xs" wrap="nowrap">
          <Image style={{ width: '36px', height: '36px' }} src="/logo.svg" alt={SITE_NAME} />
          <Title order={3} lineClamp={1} maw={{ base: '9rem', sm: '16rem' }} fz="1.4rem">
            {SITE_NAME}
          </Title>
        </Group>
      </UnstyledButton>
    </Center>
  );
}

export function BrandFooter() {
  return (
    <Center>
      <Image style={{ width: '28px', height: '28px' }} src="/logo.svg" alt={SITE_NAME} />
      <Text fw={700} ml="sm">
        {SITE_NAME}
      </Text>
    </Center>
  );
}
