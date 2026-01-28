import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Feed from './screens/Feed';

export default function Navigation() {
    return (
        <NavigationContainer>
            <Feed />
        </NavigationContainer>
    )
}