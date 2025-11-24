import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Guide du projet
        </ThemedText>
      </ThemedView>
      <ThemedText>Documentation rapide pour HEYAMA Objects.</ThemedText>
      <Collapsible title="Navigation par fichiers">
        <ThemedText>
          Deux onglets principaux: <ThemedText type="defaultSemiBold">Home</ThemedText> et{' '}
          <ThemedText type="defaultSemiBold">Explore</ThemedText>. Les objets sont dans <ThemedText type="defaultSemiBold">app/objects</ThemedText>.
        </ThemedText>
        <ThemedText>
          Le layout <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText> configure la navigation.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">En savoir plus</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS et web">
        <ThemedText>
          Ouvrez ce projet sur Android, iOS et le Web. Pour le Web, pressez{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> dans le terminal.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Images">
        <ThemedText>
          Pour les images statiques, utilisez les suffixes <ThemedText type="defaultSemiBold">@2x</ThemedText> et{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> pour les différentes densités d’écran.
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">En savoir plus</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Mode clair/sombre">
        <ThemedText>
          Le template supporte les deux modes. Le hook{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> permet d’adapter les couleurs.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">En savoir plus</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          Exemple d’animation avec le composant{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> et la librairie{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
