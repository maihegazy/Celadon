import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Card,
  Chip,
  EmptyCard,
  Hatch,
  PageTitle,
  Pill,
  Screen,
  SmallButton,
  Text,
} from '../components';
import { RECIPE_FILTERS, RECIPES, SAVED_FILTER_INDEX } from '../data/content';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/** Recipe library with filters — including the empty "saved" state. */
export function RecipesScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Recipes'>>();
  const { state, set } = useAppState();
  const { t, row } = useI18n();
  const requestedFilter = route.params?.filter;

  useEffect(() => {
    if (requestedFilter !== undefined) set({ recipeFilter: requestedFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedFilter]);

  // Nothing is saved yet in this build, so the Saved tab shows its empty state.
  const shown = state.recipeFilter === SAVED_FILTER_INDEX ? [] : RECIPES;

  return (
    <Screen tabs>
      <PageTitle
        title={t('recipes.title')}
        trailing={<SmallButton label={t('common.search')} onPress={() => navigation.navigate('Explore')} />}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {RECIPE_FILTERS.map((filter, i) => (
          <Chip
            key={filter}
            label={t(filter)}
            selected={state.recipeFilter === i}
            onPress={() => set({ recipeFilter: i })}
            size={13.5}
            paddingVertical={9}
            paddingHorizontal={16}
            style={{ borderRadius: 20 }}
          />
        ))}
      </ScrollView>

      {shown.length === 0 ? (
        <EmptyCard style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 8 }}>
          <Text weight="semibold" size={15}>
            {t('recipes.empty.title')}
          </Text>
          <Text size={13} color={colors.muted} lineHeight={20} align="center">
            {t('recipes.empty.body')}
          </Text>
        </EmptyCard>
      ) : (
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 12 }}>
          {shown.map((recipe) => (
            <Pressable
              key={recipe.name}
              accessibilityRole="button"
              onPress={() => navigation.navigate('RecipeDetail', { name: recipe.name })}
              style={({ pressed }) => [{ flexGrow: 1, flexBasis: '46%' }, pressed && { opacity: 0.85 }]}
            >
              <Card style={{ overflow: 'hidden' }}>
                <Hatch band={7} style={{ height: 100 }}>
                  <Text mono size={10} color={colors.faint}>
                    {t('recipes.photo')}
                  </Text>
                </Hatch>
                <View style={{ padding: 12 }}>
                  <Text weight="semibold" size={14} lineHeight={18}>
                    {t(recipe.name)}
                  </Text>
                  <View style={{ flexDirection: row, gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <Pill
                      label={t(recipe.tag)}
                      size={11}
                      style={{ borderRadius: radius.thumbSm, paddingHorizontal: 9, paddingVertical: 3 }}
                    />
                    <Pill
                      label={t('common.minutes', { count: recipe.minutes })}
                      size={11}
                      weight="semibold"
                      background={colors.sunken}
                      color={colors.muted}
                      style={{ borderRadius: radius.thumbSm, paddingHorizontal: 9, paddingVertical: 3 }}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
