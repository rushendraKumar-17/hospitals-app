// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SelectionScreen from './src/screens/SelectionScreen';
import MapScreen from './src/screens/MapScreen';
import { AppProvider } from './src/context/AppContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Selection">
        <Stack.Screen name="Selection" component={SelectionScreen} />
        <Stack.Screen name="Map" component={MapScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
    </AppProvider>
  );
}
