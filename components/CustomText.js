import { Text } from 'react-native';

export default function CustomText(props) {
  return <Text {...props} style={[props.style, { fontFamily: 'StreetSoul' }]} />;
}
