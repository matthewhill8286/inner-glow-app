import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { toast } from '@/components/Toast';
import { DarkToast } from '@/components/practices/PracticeParts';
import { useFavourites } from '@/hooks/usePractices';

/**
 * The favourite heart for Set up and Video details (10 §3.5): white circle, filled heart on a lilac
 * circle when saved, and a dark toast for 2 s after each change. Returns the button and the toast.
 */
export function useFavouriteHeart(practiceId: string, toastBottom: number) {
  const { t } = useTranslation();
  const { isFavourite, setFavourite } = useFavourites();
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const saved = isFavourite(practiceId);

  async function toggle() {
    try {
      await setFavourite(practiceId, !saved);
      setText(t(saved ? 'practices.setup.removed' : 'practices.setup.saved'));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setText(null), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    button: (
      <IconButton
        variant="solid"
        icon={saved ? 'line/heart-filled' : 'line/heart'}
        iconSize={20}
        active={saved}
        accessibilityLabel={t(saved ? 'practices.setup.unfavourite' : 'practices.setup.favourite')}
        onPress={() => void toggle()}
      />
    ),
    toast: <DarkToast text={text ?? ''} visible={!!text} bottom={toastBottom} />,
  };
}
