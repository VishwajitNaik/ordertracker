import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

const RestList = () => {

    const { rest } = useLocalSearchParams<{rest: string[]}>();

  return ( 
    <View style={styles.container}>
      <Text>RestList with id {rest.join("/")}</Text>
    </View>
  )
}

export default RestList

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5FCFF",
    }
})