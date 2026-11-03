import React from 'react';
import { HelpCentre } from '@/components/help/HelpCentre';

/** Contact us opens the Help Centre on its Contact us tab, so older links keep working. */
export default function ContactScreen() {
  return <HelpCentre initialTab="contact" />;
}
