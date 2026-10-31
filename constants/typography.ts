import { Platform } from 'react-native';

// Serif titles give the app its editorial character. Interface copy uses the
// platform's system sans-serif so controls and longer passages stay readable.
const family = {
  heading: Platform.OS === 'android' ? 'serif' : 'Georgia',
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  }),
};

const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const Typography = {
  family,
  weight,
  heading: {
    fontFamily: family.heading,
    fontSize: 24,
    fontWeight: weight.regular,
    letterSpacing: -0.2,
  },
  section: {
    fontFamily: family.heading,
    fontSize: 20,
    fontWeight: weight.regular,
    letterSpacing: -0.1,
  },
  cardHeading: {
    fontFamily: family.body,
    fontSize: 17,
    fontWeight: weight.semibold,
    letterSpacing: 0,
  },
  body: {
    fontFamily: family.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: weight.regular,
  },
  caption: {
    fontFamily: family.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: weight.regular,
  },
  label: {
    fontFamily: family.body,
    fontSize: 12,
    fontWeight: weight.semibold,
    letterSpacing: 0.8,
  },
};
