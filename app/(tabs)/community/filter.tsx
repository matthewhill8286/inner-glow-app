import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
/** Preserve existing links while opening the filter over its feed. */
export default function CommunityFilterLink() {
  const { categories, types } = useLocalSearchParams<{ categories?: string; types?: string }>();
  return (
    <Redirect
      href={{
        pathname: '/(tabs)/community',
        params: { filter: 'open', categories: categories || '', types: types || '' },
      }}
    />
  );
}
