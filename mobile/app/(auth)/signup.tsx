import { KeyboardAvoidingView, ActivityIndicator, TouchableOpacity, StyleSheet, Text, View, Platform, TextInput } from 'react-native'
import React from 'react'
import styles from '../../assets/styles/signup.styles'
import COLORS from "../../constants/color"
import { Ionicons } from '@expo/vector-icons'
import { Link, useRouter } from 'expo-router'
import { useAuthStore } from '../../store/authStore'

export default function Signup() {
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showpassword, setShowPassword] = React.useState(false)
  const [username, setUsername] = React.useState('')

  const {user, isLoading, register, token} = useAuthStore () as any;

  const router = useRouter()



  const handleSignup = async () => {
    // Basic form validation
    if (!username || !phone || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    const res = await register(username, email, phone, password);

    if (!res.success) {
      alert(res.error || "Something went wrong during registration.");
      return;
    }

    alert("Registration successful!");
    router.replace("/"); // or wherever you want to navigate after signup
  };
  
  console.log("User: ", user);
  console.log("Token", token);
  
  

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Join us to get started</Text>
          </View>
          <View style={styles.formContainer}>
            {/* USER NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>User Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name='person-outline'
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder='Enter your username'
                  placeholderTextColor={COLORS.placeholderText}
                  value={username}
                  onChangeText={setUsername}
                  keyboardType='default'
                  style={styles.input}
                />
              </View>
            </View>
            {/* PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name='call-outline'
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder='Enter your phone number'
                  placeholderTextColor={COLORS.placeholderText}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType='phone-pad'
                  style={styles.input}
                />
              </View>
            </View>
            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name='mail-outline'
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder='Enter your email (optional)'
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  style={styles.input}
                />
              </View>
            </View>
            {/* PASSWORD */}
            <View style={styles.inputGroup}>
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

                <TouchableOpacity onPress={() => setShowPassword(!showpassword)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={showpassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* SIGN UP BUTTON */}
            <TouchableOpacity style={styles.button} onPress={() => handleSignup() } disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href={"/"} style={styles.link}>
                <Text style={styles.link}>Login</Text>
              </Link>
            </View>

          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
