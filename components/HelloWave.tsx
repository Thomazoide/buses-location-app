
import { Image } from 'react-native';
import { ThemedView } from './ThemedView';

export function HelloWave() {
  

  return (
    <ThemedView>
      <Image source={require('@/assets/images/map-icon.webp')}/>
    </ThemedView>
  );
}
