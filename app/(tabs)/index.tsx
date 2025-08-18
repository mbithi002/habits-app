import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Text, View } from "react-native";
import { Button } from "react-native-paper";
import '../global.css';
import { useAuth } from "../lib/auth-context";

const index = () => {
  const { signOut } = useAuth();
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-white text-xl font-bold">
        Hello NativeWind <Feather />
      </Text>
      <Button mode="text" onPress={signOut} icon={"logout"}>
        Logout
      </Button>
    </View>
  );
};

export default index;
