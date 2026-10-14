import { ColorInput, Fieldset, Group, NumberInput, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export interface TeamStyleValues {
  shirt_color_1: string;
  shirt_color_2: string;
  shirt_color_3: string;
  shirt_text_color: string;
  shirt_angle: number;
  emoji: string;
}

interface TeamStyleSource {
  shirt_color_1?: string | null;
  shirt_color_2?: string | null;
  shirt_color_3?: string | null;
  shirt_text_color?: string | null;
  shirt_angle?: number;
  emoji?: string | null;
}

const DEFAULT_ANGLE = 180;

export function teamStyleInitialValues(team?: TeamStyleSource | null): TeamStyleValues {
  return {
    shirt_color_1: team?.shirt_color_1 ?? '',
    shirt_color_2: team?.shirt_color_2 ?? '',
    shirt_color_3: team?.shirt_color_3 ?? '',
    shirt_text_color: team?.shirt_text_color ?? '',
    shirt_angle: team?.shirt_angle ?? DEFAULT_ANGLE,
    emoji: team?.emoji ?? '',
  };
}

// Para la API: un campo vacío se manda como null, así se puede borrar algo ya cargado.
export function teamStylePayload(values: TeamStyleValues) {
  const orNull = (value: string) => (value.trim() === '' ? null : value.trim());
  return {
    shirt_color_1: orNull(values.shirt_color_1),
    shirt_color_2: orNull(values.shirt_color_2),
    shirt_color_3: orNull(values.shirt_color_3),
    shirt_text_color: orNull(values.shirt_text_color),
    shirt_angle: typeof values.shirt_angle === 'number' ? values.shirt_angle : DEFAULT_ANGLE,
    emoji: orNull(values.emoji),
  };
}

function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

// Negro o blanco según el fondo (igual criterio que el bot cuando no hay color de texto).
function readableTextColor(background: string) {
  const r = parseInt(background.slice(1, 3), 16);
  const g = parseInt(background.slice(3, 5), 16);
  const b = parseInt(background.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000000' : '#FFFFFF';
}

// En Haxball 0° = franjas verticales y 90° = horizontales; en CSS eso es "90 + ángulo".
function shirtBackground(colors: string[], angle: number) {
  if (colors.length === 0) return 'var(--mantine-color-gray-3)';
  if (colors.length === 1) return colors[0];

  const step = 100 / colors.length;
  const stops = colors.map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`);
  return `linear-gradient(${90 + angle}deg, ${stops.join(', ')})`;
}

export function TeamShirtPreview({ values }: { values: TeamStyleValues }) {
  const { t } = useTranslation();
  const colors = [values.shirt_color_1, values.shirt_color_2, values.shirt_color_3].filter(isHex);
  const textColor = isHex(values.shirt_text_color)
    ? values.shirt_text_color
    : colors.length > 0
      ? readableTextColor(colors[0])
      : '#000000';

  return (
    <Group gap="sm" mt="xs">
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: shirtBackground(colors, Number(values.shirt_angle) || 0),
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          border: '1px solid var(--mantine-color-gray-5)',
        }}
      >
        10
      </div>
      {values.emoji.trim() !== '' && <Text size="xl">{values.emoji}</Text>}
      <Text size="xs" c="dimmed">
        {t('shirt_preview_label')}
      </Text>
    </Group>
  );
}

export function TeamStyleFields({ form }: { form: any }) {
  const { t } = useTranslation();
  const swatches = ['#FFFFFF', '#000000', '#FF1212', '#0800FF', '#11AE3B', '#FFDC02', '#13C6F2'];

  return (
    <Fieldset legend={t('team_style_title')} mt={12} radius="md">
      <Text size="xs" c="dimmed" mb="xs">
        {t('team_style_hint')}
      </Text>

      <Group grow align="flex-start">
        {[1, 2, 3].map((n) => (
          <ColorInput
            key={n}
            format="hex"
            swatches={swatches}
            withEyeDropper={false}
            label={t('shirt_color_label', { n })}
            placeholder="#RRGGBB"
            {...form.getInputProps(`shirt_color_${n}`)}
          />
        ))}
      </Group>

      <Group grow align="flex-start" mt="sm">
        <ColorInput
          format="hex"
          swatches={swatches}
          withEyeDropper={false}
          label={t('shirt_text_color_label')}
          placeholder="#RRGGBB"
          {...form.getInputProps('shirt_text_color')}
        />
        <NumberInput
          label={t('shirt_angle_label')}
          description={t('shirt_angle_description')}
          min={0}
          max={360}
          step={15}
          clampBehavior="strict"
          allowDecimal={false}
          {...form.getInputProps('shirt_angle')}
        />
      </Group>

      <TextInput
        mt="sm"
        label={t('team_emoji_label')}
        description={t('team_emoji_description')}
        maxLength={16}
        {...form.getInputProps('emoji')}
      />

      <TeamShirtPreview values={form.values} />
    </Fieldset>
  );
}
