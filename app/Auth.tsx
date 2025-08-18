import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "./lib/auth-context";

export default function Auth() {
  const router = useRouter();
  const [isSignUp, setSignUp] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError(null);

    if (isSignUp) {
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
      router.replace("/");
    }
  };

  const handleSwitchMode = () => setSignUp((prev) => !prev);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-2xl font-bold text-center mb-6">
          {isSignUp ? "Create Account" : "Welcome Back!"}
        </Text>

        {/* Email */}
        <TextInput
          placeholder="you@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          onChangeText={setEmail}
        />

        {/* Password */}
        <TextInput
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          className="border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base"
          onChangeText={setPassword}
        />

        {error && (
          <Text className="text-red-500 text-center mb-2">{error}</Text>
        )}

        {/* Main Action */}
        <TouchableOpacity
          onPress={handleAuth}
          className="bg-blue-500 rounded-xl py-4 mb-4"
        >
          <Text className="text-center text-white font-semibold text-lg">
            {isSignUp ? "Sign Up" : "Sign In"}
          </Text>
        </TouchableOpacity>

        {/* Switch Mode */}
        <TouchableOpacity onPress={handleSwitchMode}>
          <Text className="text-center text-gray-600">
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don’t have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
