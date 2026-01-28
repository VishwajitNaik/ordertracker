import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function Products() {
  return (
    <View style={styles.container}>
      <Text>Products</Text>
        <Link href="/Products/1">Product 1</Link>
        <Link href="/Products/2">Product 2</Link>
        <Link href="/Products/3">Product 3</Link>

        <Link href="/Products/best-sellers/playstation-5">Product 4</Link>
        <Link href="/Products/deals/black-friday/playstation-5">Product 5</Link>    
        <Link href="/Products/search/playstation-5">Product 6</Link>

    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5FCFF",
    }
})