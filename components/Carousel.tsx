import React, { useMemo } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';
import type { AnimatedProps } from 'react-native-reanimated';
import Carousel, { CarouselRenderItem } from 'react-native-reanimated-carousel';
import {
  ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';

interface Props extends AnimatedProps<ViewProps> {
  style?: StyleProp<ImageStyle>;
  index?: number;
  rounded?: boolean;
  source?: ImageSourcePropType;
  colorFill?: boolean;
  PURPLE_IMAGES: ImageSourcePropType[];
  testID?: string;
}

export const SlideItem: React.FC<Props> = (props) => {
  const {
    style,
    index = 0,
    rounded = false,
    testID,
    colorFill = false,
    PURPLE_IMAGES,
    ...animatedViewProps
  } = props;

  const source = useMemo(
    () => props.source || PURPLE_IMAGES[index % PURPLE_IMAGES.length],
    [PURPLE_IMAGES, index, props.source],
  );

  return (
    <Animated.View testID={testID} style={{ flex: 1 }} {...animatedViewProps}>
      {!colorFill && (
        <Animated.Image
          style={[style, styles.container, rounded && { borderRadius: 15 }]}
          source={source}
          resizeMode="cover"
        />
      )}
      {colorFill && <View style={[styles.colorFill, rounded && { borderRadius: 15 }]} />}
      <View style={styles.overlay}>
        <View style={styles.overlayTextContainer}>
          <Text testID={`slide-index-${index}`} style={styles.overlayText}>{`Slide ${index}`}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overlayTextContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'gray',
  },
});

interface Options {
  colorFill?: boolean;
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
  PURPLE_IMAGES?: ImageSourcePropType[];
}

export const renderItem =
  ({
    rounded = false,
    colorFill = false,
    style,
    PURPLE_IMAGES,
  }: Options = {}): CarouselRenderItem<any> =>
  // eslint-disable-next-line react/display-name
  ({ index }: { index: number }) => (
    <SlideItem
      PURPLE_IMAGES={PURPLE_IMAGES ?? []}
      key={index}
      index={index}
      rounded={rounded}
      colorFill={colorFill}
      style={style}
    />
  );

const defaultDataWith6Colors = ['#B0604D', '#899F9C', '#B3C680', '#5C6265', '#F5D399', '#F1F1F1'];

function Index() {
  const progress = useSharedValue<number>(0);

  return (
    <View id="carousel-component">
      <Carousel
        autoPlayInterval={2000}
        data={defaultDataWith6Colors}
        loop={true}
        width={window.innerWidth}
        pagingEnabled={true}
        snapEnabled={true}
        style={{
          width: window.innerWidth,
          height: 258,
        }}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        onProgressChange={(offsetProgress, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        renderItem={renderItem({ rounded: true })}
      />
    </View>
  );
}

export default Index;
