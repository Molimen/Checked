import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<any>();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Button mode="contained" onPress={() => navigation.goBack()}>Back (id: {params?.id})</Button>
    </SafeAreaView>
  );
}