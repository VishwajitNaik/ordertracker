import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import styles from '../../assets/styles/login.styles'
import { Link } from 'expo-router'
import React from 'react'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import COLORS from '@/constants/color'
import { useAuthStore } from '../../store/authStore'

export default function login() {
  
  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showpassword, setShowPassword] = React.useState(false)

  const { login, isLoading } = useAuthStore() as any;




  const handleLogin = async () => {
    const res = await login(identifier, password);
    if (!res.success) {
      alert(res.error || "Something went wrong during login.");
      return;
    }
    alert("Login successful!");
  }

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={styles.container}>
      <View style={styles.topIllustration}>
        <Image
          source={require('../../assets/images/OrderTracker.png')}
          style={styles.topIllustration}
          resizeMode='contain'
        />
      </View>
      <View style={styles.card}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Login</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email or Phone</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name='mail-outline'
              size={20}
              color={COLORS.primary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder='Enter your email or phone number'
              placeholderTextColor={COLORS.placeholderText}
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons 
              name='lock-closed-outline'
              size={20}
              color={COLORS.primary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder='Enter your password'
              placeholderTextColor={COLORS.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showpassword}
              style={styles.input}
            />  

            <TouchableOpacity
              onPress={() => setShowPassword(!showpassword)}
              style={styles.eyeIcon}
              >

              <Ionicons 
                name={showpassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        { /* FOOTER */ }
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/signup" style={styles.link}>
            Sign Up
          </Link>
          </View>
      </View>
      </View>
    </View>
    </KeyboardAvoidingView>
  )
}
