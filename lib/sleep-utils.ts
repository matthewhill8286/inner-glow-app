import { t } from 'i18next';

export function getQualityLabel(quality?: number) {
  switch (quality) {
    case 5:
      return t('common.excellent');
    case 4:
      return t('common.good');
    case 3:
      return t('common.fair');
    case 2:
      return t('common.poor');
    case 1:
      return t('common.veryPoor');
    default:
      return t('common.notApplicable');
  }
}
