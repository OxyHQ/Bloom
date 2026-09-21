import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGlobals } from 'storybook/preview-api';
import { SocialTemplate } from '../../templates/social/SocialTemplate';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.web';
import {
  COLOR_PRESET_FAMILY_REGISTRY,
  COLOR_PRESET_REGISTRY,
  type ColorPresetFamily,
  type ColorPresetPairing,
  type ColorPresetRecipe,
} from './color-presets';
import { getResolvedTokens } from './token-registry';

type ColorMode = 'light' | 'dark';

interface LabPalette {
  canvas: string;
  shell: string;
  surface: string;
  raised: string;
  text: string;
  textMuted: string;
  identity: string;
  onIdentity: string;
  action: string;
  onAction: string;
  actionSoft: string;
}

type ColorRecipe = ColorPresetRecipe;

const COLOR_RECIPES: readonly ColorRecipe[] = COLOR_PRESET_REGISTRY;

type RecipeFamilyFilter = 'all' | ColorPresetFamily;
type RecipePairingFilter = 'all' | ColorPresetPairing;

function resolveLabPalette(recipe: ColorRecipe, mode: ColorMode): LabPalette {
  const tokens = getResolvedTokens(recipe.name, mode);
  const token = (name: string): string => tokens[`--${name}`] ?? 'rgb(0 0 0)';

  return {
    canvas: token('background'),
    shell: token('surface'),
    surface: token('popover'),
    raised: token('card'),
    text: token('foreground'),
    textMuted: token('muted-foreground'),
    identity: token('primary'),
    onIdentity: token('primary-foreground'),
    action: token('tertiary'),
    onAction: token('tertiary-foreground'),
    actionSoft: token('tertiary-subtle'),
  };
}
const meta: Meta = {
  title: 'Foundations/Color System Playground',
  parameters: {
    layout: 'fullscreen',
    bloomScroll: 'document',
  },
};

export default meta;

type Story = StoryObj;

function Swatch({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <View style={styles.swatchItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <View style={styles.swatchLabel}>
        <Text style={[styles.swatchName, { color: text }]}>{label}</Text>
        <Text style={[styles.swatchHex, { color: text }]}>{color}</Text>
      </View>
    </View>
  );
}

function FilterButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={[styles.filterButton, selected && styles.filterButtonSelected]}
    >
      <Text style={[styles.filterButtonText, selected && styles.filterButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ColorSystemLab({ globals, updateGlobals }: { globals: Record<string, unknown>; updateGlobals: (globals: Record<string, unknown>) => void }) {
  const [authenticated, setAuthenticated] = useState(true);
  const [familyFilter, setFamilyFilter] = useState<RecipeFamilyFilter>('all');
  const [pairingFilter, setPairingFilter] = useState<RecipePairingFilter>('curated');
  const visibleRecipes = COLOR_RECIPES.filter(
    (recipe) =>
      (familyFilter === 'all' || recipe.family === familyFilter) &&
      (pairingFilter === 'all' || recipe.pairing === pairingFilter),
  );
  const activeRecipe = COLOR_RECIPES.find(recipe => recipe.name === globals.colorPreset) ?? COLOR_RECIPES[0];
  if (activeRecipe === undefined) return null;
  const activeLight = resolveLabPalette(activeRecipe, 'light');
  const activeDark = resolveLabPalette(activeRecipe, 'dark');

  return (
    <>

    <View style={styles.page}>
      <View style={styles.labHeader}>
        <View style={styles.labHeading}>
          <Text style={styles.labEyebrow}>BLOOM COLOR LAB · MENTION INTERFACE</Text>
          <Text style={styles.labTitle}>More energy, less pastel</Text>
          <Text style={styles.labDescription}>
            The same Mention structure applied to {COLOR_RECIPES.length} dynamic recipes. Large
            surfaces stay neutral while identity and action carry the saturated colour.
          </Text>
          <Button href="./?path=/story/foundations-color-roles-in-context--first-direction" target="_top" appearance="outline" tone="neutral" style={{ alignSelf: 'flex-start' }}>
            Open colour roles in context
          </Button>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#75805D' }]} />
            <Text style={styles.legendText}>Identity: selection, navigation and brand</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E9B522' }]} />
            <Text style={styles.legendText}>Action: one dominant CTA in each context</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#BDB6AC' }]} />
            <Text style={styles.legendText}>Hierarchy: flow, spacing and radius without decorative boxes</Text>
          </View>
        </View>
      </View>

      <View style={styles.paletteMapHeader}>
        <Text style={styles.paletteMapTitle}>{COLOR_RECIPES.length} directions to compare</Text>
        <Text style={styles.paletteMapDescription}>
          Filter by family or curated/derived pairing. Every card shows light and dark.
        </Text>
      </View>

      <View style={styles.filterStack}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Family</Text>
          <FilterButton
            label="All"
            selected={familyFilter === 'all'}
            onPress={() => {
              setFamilyFilter('all');
            }}
          />
          {COLOR_PRESET_FAMILY_REGISTRY.map((family) => (
            <FilterButton
              key={family.name}
              label={family.displayName}
              selected={familyFilter === family.name}
              onPress={() => {
                setFamilyFilter(family.name);
                }}
            />
          ))}
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Pairing</Text>
          <FilterButton
            label="All"
            selected={pairingFilter === 'all'}
            onPress={() => {
              setPairingFilter('all');
            }}
          />
          <FilterButton
            label="Curated combinations"
            selected={pairingFilter === 'curated'}
            onPress={() => {
              setPairingFilter('curated');
            }}
          />
          <FilterButton
            label="Derived"
            selected={pairingFilter === 'derived'}
            onPress={() => {
              setPairingFilter('derived');
            }}
          />
          <Text style={styles.filterCount}>{visibleRecipes.length} visible</Text>
        </View>
      </View>

      <View style={styles.recipeGrid}>
        {visibleRecipes.map((recipe) => {
          const selected = recipe.name === activeRecipe.name;
          const light = resolveLabPalette(recipe, 'light');
          const dark = resolveLabPalette(recipe, 'dark');
          return (
            <Pressable
              key={recipe.name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              aria-pressed={selected}
              onPress={() => updateGlobals({ colorPreset: recipe.name })}
              style={[
                styles.recipeButton,
                selected ? styles.recipeButtonSelected : styles.recipeButtonIdle,
              ]}
            >
              <View style={styles.recipeModes}>
                <View style={styles.recipeSwatches}>
                  <View style={[styles.recipeSwatch, { backgroundColor: light.canvas }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: light.identity }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: light.action }]} />
                </View>
                <View style={styles.recipeSwatches}>
                  <View style={[styles.recipeSwatch, { backgroundColor: dark.canvas }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: dark.identity }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: dark.action }]} />
                </View>
              </View>
              <Text style={styles.recipeName}>{recipe.displayName}</Text>
              <Text style={styles.recipeSource}>{recipe.family} · {recipe.pairing}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.recipeIntro}>
        <View style={styles.recipeIntroCopy}>
          <Text style={styles.recipeTitle}>{activeRecipe.displayName}</Text>
          <Text style={styles.recipeIdea}>{activeRecipe.description}</Text>
        </View>
        <View style={styles.rulePill}>
          <Text style={styles.rulePillText}>The palette changes by mode; the relationship stays intact</Text>
        </View>
      </View>

      <View style={styles.viewerModeRow}>
        <Text style={styles.viewerModeLabel}>Mention state</Text>
        <View style={styles.viewerModeControl}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: authenticated }}
            aria-pressed={authenticated}
            onPress={() => setAuthenticated(true)}
            style={[styles.viewerModeButton, authenticated && styles.viewerModeButtonSelected]}
          >
            <Text style={[styles.viewerModeButtonText, authenticated && styles.viewerModeButtonTextSelected]}>
              Signed in
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !authenticated }}
            aria-pressed={!authenticated}
            onPress={() => setAuthenticated(false)}
            style={[styles.viewerModeButton, !authenticated && styles.viewerModeButtonSelected]}
          >
            <Text style={[styles.viewerModeButtonText, !authenticated && styles.viewerModeButtonTextSelected]}>
              Public view
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.viewerModeRow}>
        <Text style={styles.viewerModeLabel}>Appearance</Text>
        <Button size="sm" tone="neutral" appearance={globals.theme === 'dark' ? 'subtle' : 'solid'} onPress={() => updateGlobals({ theme: 'light' })}>Light mode</Button>
        <Button size="sm" tone="neutral" appearance={globals.theme === 'dark' ? 'solid' : 'subtle'} onPress={() => updateGlobals({ theme: 'dark' })}>Dark mode</Button>
      </View>

      <View style={styles.swatchSection}>
        <View style={styles.swatchMode}>
          <Text style={styles.swatchModeTitle}>Light · neutral layers, concentrated colour</Text>
          <View style={styles.swatchRow}>
            <Swatch label="Canvas" color={activeLight.canvas} text="#18202A" />
            <Swatch label="Shell" color={activeLight.shell} text="#18202A" />
            <Swatch label="Surface" color={activeLight.surface} text="#18202A" />
            <Swatch label="Raised" color={activeLight.raised} text="#18202A" />
            <Swatch label="Identity" color={activeLight.identity} text="#18202A" />
            <Swatch label="Action" color={activeLight.action} text="#18202A" />
          </View>
        </View>
        <View style={styles.swatchMode}>
          <Text style={styles.swatchModeTitle}>Dark · deep layers, not inverted</Text>
          <View style={styles.swatchRow}>
            <Swatch label="Canvas" color={activeDark.canvas} text="#18202A" />
            <Swatch label="Shell" color={activeDark.shell} text="#18202A" />
            <Swatch label="Surface" color={activeDark.surface} text="#18202A" />
            <Swatch label="Raised" color={activeDark.raised} text="#18202A" />
            <Swatch label="Identity" color={activeDark.identity} text="#18202A" />
            <Swatch label="Action" color={activeDark.action} text="#18202A" />
          </View>
        </View>
      </View>
    </View>
    <SocialTemplate authenticated={authenticated} />
    </>
  );
}

export const Playground: Story = {
  parameters: { controls: { disable: true } },
  render: function Playground() {
    const [globals, updateGlobals] = useGlobals();
    return <ColorSystemLab globals={globals} updateGlobals={updateGlobals} />;
  },
};

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    padding: 32,
    gap: 28,
    backgroundColor: '#F1EEE8',
  },
  labHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
  },
  labHeading: {
    maxWidth: '100%',
    gap: 8,
  },
  labEyebrow: {
    color: '#6E655B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  labTitle: {
    color: '#1F1C19',
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  labDescription: {
    color: '#625B54',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '100%',
  },
  legend: {
    maxWidth: '100%',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E7E2DA',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flexShrink: 1,
    color: '#4C4640',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  paletteMapHeader: {
    gap: 3,
  },
  paletteMapTitle: {
    color: '#1F1C19',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  paletteMapDescription: {
    color: '#625B54',
    fontSize: 13,
    lineHeight: 18,
  },
  filterStack: {
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    width: 68,
    color: '#4C4640',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E4DFD7',
  },
  filterButtonSelected: {
    backgroundColor: '#1F1C19',
  },
  filterButtonText: {
    color: '#625B54',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  filterCount: {
    color: '#766F67',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeButton: {
    minWidth: 180,
    maxWidth: 220,
    flexGrow: 1,
    flexBasis: 210,
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  recipeButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  recipeButtonIdle: {
    backgroundColor: '#E9E5DE',
  },
  recipeModes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recipeSwatches: {
    flexDirection: 'row',
  },
  recipeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recipeName: {
    color: '#1F1C19',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  recipeSource: {
    color: '#766F67',
    fontSize: 11,
    lineHeight: 15,
  },
  recipeIntro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  recipeIntroCopy: {
    maxWidth: '100%',
    gap: 4,
  },
  recipeTitle: {
    color: '#1F1C19',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  recipeIdea: {
    color: '#625B54',
    fontSize: 14,
    lineHeight: 21,
  },
  rulePill: {
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#DFD9D0',
  },
  rulePillText: {
    color: '#4C4640',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  viewerModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewerModeLabel: {
    color: '#4C4640',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  viewerModeControl: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#DFD9D0',
    flexDirection: 'row',
    gap: 4,
  },
  viewerModeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  viewerModeButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  viewerModeButtonText: {
    color: '#6E655B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  viewerModeButtonTextSelected: {
    color: '#1F1C19',
  },
  swatchSection: {
    gap: 18,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#E7E2DA',
  },
  swatchMode: {
    gap: 10,
  },
  swatchModeTitle: {
    color: '#1F1C19',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchItem: {
    width: 154,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F7F5F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 28, 25, 0.12)',
  },
  swatchLabel: {
    gap: 1,
  },
  swatchName: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  swatchHex: {
    fontSize: 9,
    lineHeight: 12,
    opacity: 0.62,
  },
});
