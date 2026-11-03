import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { HelpCentre } from '@/components/help/HelpCentre';

export default function HelpCenterScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <HelpCentre initialTab={tab === 'contact' ? 'contact' : 'faq'} />;
}
