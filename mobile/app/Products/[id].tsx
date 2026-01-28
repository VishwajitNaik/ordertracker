import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

const List = () => {

    const { id } = useLocalSearchParams()

  return (
    <View style={styles.container}>
      <Text>Listw with id {id}</Text>
    </View>
  )
}

export default List

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5FCFF",
    }
})