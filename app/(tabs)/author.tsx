// screens/author.tsx
/**
 * Author screen
 * - Replace values in the AUTHOR constant with real data (name, bio, links, repos, etc.)
 * - Uses Tailwind/nativewind-style `className` as in your project
 */

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";

type Repo = { name: string; description?: string; url: string };

const AUTHOR = {
  name: "Lucky Mbithi",
  role: "Mobile Developer — App Creator",
  avatarUri: "",
  location: "Nairobi, Kenya",
  email: "luckymbithi002@gmail.com",
  phone: "+254795724234",
  website: "https://denahub.com",
  github: "https://github.com/mbithi002",
  linkedin: "https://www.linkedin.com/in/luckymbithi",
  twitter: "https://twitter.com/amiri_lucky",
  bio: `Hi, I'm the developer of this Habit Tracker app. I build mobile apps focused
on reliability and local-day accuracy. If you found a bug or want to collaborate,
please reach out via email or GitHub.`,
  skills: ["React Native", "TypeScript", "Appwrite", "Expo", "Node.js"],
  repos: [
    {
      name: "habit-tracker",
      description:
        "Mobile habit tracker built with Expo, Appwrite and native UI.",
      url: "https://github.com/mbithi002/habits-app",
    },
  ] as Repo[],
};

function openUrl(url: string) {
  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert("Can't open the link", url);
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => {
      console.error("openUrl error", err);
      Alert.alert("Error", "Failed to open link");
    });
}

async function handleEmail(email: string) {
  const url = `mailto:${email}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Error", "Could not open mail client");
  }
}

async function handlePhone(phone: string) {
  const url = `tel:${phone}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Error", "Could not open phone dialer");
  }
}

async function handleShare() {
  try {
    await Share.share({
      message: `Check out this app by ${AUTHOR.name} — ${AUTHOR.website}`,
      url: AUTHOR.website,
      title: `${AUTHOR.name} — Mobile App`,
    });
  } catch (err) {
    console.error("share error", err);
  }
}

function Avatar({ uri, name }: { uri?: string; name: string }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className="w-24 h-24 rounded-2xl bg-gray-200"
        accessibilityLabel={`${name} avatar`}
      />
    );
  }
  // initials fallback
  const initials = name
    .split(" ")
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View className="w-24 h-24 rounded-2xl bg-orange-100 items-center justify-center">
      <Text className="text-xl font-bold text-orange-800">{initials}</Text>
    </View>
  );
}

function IconBtn({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white border border-gray-100 rounded-xl p-3 flex-1 mr-2"
    >
      <View className="w-8 items-center">{icon}</View>
      <Text className="ml-3 font-semibold text-sm text-gray-900">{label}</Text>
    </Pressable>
  );
}

export default function AuthorScreen() {
  return (
    <ScrollView
      className="bg-[#f5f5f5]"
      contentContainerClassName="p-5 pb-12 min-h-full"
    >
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Avatar uri={AUTHOR.avatarUri} name={AUTHOR.name} />
        <View className="ml-4 flex-1">
          <Text className="text-2xl font-bold text-gray-900">
            {AUTHOR.name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">{AUTHOR.role}</Text>
          <View className="flex-row items-center mt-2">
            <Feather name="map-pin" size={14} color="#6b7280" />
            <Text className="ml-2 text-xs text-gray-500">
              {AUTHOR.location}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row mb-4">
        <IconBtn
          icon={
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#111827"
            />
          }
          label="Email"
          onPress={() => handleEmail(AUTHOR.email)}
        />
        <IconBtn
          icon={
            <MaterialCommunityIcons name="phone" size={18} color="#111827" />
          }
          label="Call"
          onPress={() => handlePhone(AUTHOR.phone)}
        />
      </View>

      <View className="flex-row mb-4">
        <IconBtn
          icon={
            <MaterialCommunityIcons name="github" size={20} color="#111827" />
          }
          label="GitHub"
          onPress={() => openUrl(AUTHOR.github)}
        />
        <IconBtn
          icon={<MaterialCommunityIcons name="web" size={20} color="#111827" />}
          label="Website"
          onPress={() => openUrl(AUTHOR.website)}
        />
      </View>

      <View className="flex-row mb-4">
        <Pressable
          onPress={() => openUrl(AUTHOR.linkedin)}
          className="flex-row items-center bg-white border border-gray-100 rounded-xl p-3 flex-1 mr-2"
        >
          <MaterialCommunityIcons name="linkedin" size={20} />
          <Text className="ml-3 font-semibold text-sm text-gray-900">
            LinkedIn
          </Text>
        </Pressable>

        <Pressable
          onPress={() => openUrl(AUTHOR.twitter)}
          className="flex-row items-center bg-white border border-gray-100 rounded-xl p-3 flex-1"
        >
          <MaterialCommunityIcons name="twitter" size={20} />
          <Text className="ml-3 font-semibold text-sm text-gray-900">
            Twitter
          </Text>
        </Pressable>
      </View>

      {/* Share / Feedback */}
      <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <View className="flex-col items-center justify-between">
          <View>
            <Text className="font-semibold text-gray-900">
              Share & Feedback
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Share the app or send a quick message to the author.
            </Text>
          </View>

          <View className="flex-row">
            <Pressable
              onPress={handleShare}
              className="px-4 py-2 bg-orange-400 rounded-lg items-center justify-center mr-2"
            >
              <Text className="text-white font-semibold">Share</Text>
            </Pressable>

            <Pressable
              onPress={() => handleEmail(AUTHOR.email)}
              className="px-4 py-2 border border-slate-200 rounded-lg items-center justify-center"
            >
              <Text className="text-gray-900 font-semibold">Report bug</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <Text className="font-semibold text-gray-900 mb-2">About</Text>
        <Text className="text-gray-700 text-sm leading-relaxed">
          {AUTHOR.bio}
        </Text>

        {/* Skills */}
        <View className="flex-row flex-wrap gap-2 mt-4">
          {AUTHOR.skills.map((s) => (
            <View
              key={s}
              className="bg-gray-100 px-3 py-1 rounded-full mr-2 mt-2"
            >
              <Text className="text-xs text-gray-700 font-medium">{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Repositories / links */}
      <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
        <Text className="font-semibold text-gray-900 mb-3">
          Open source & Links
        </Text>

        {AUTHOR.repos.map((r) => (
          <Pressable
            key={r.url}
            onPress={() => openUrl(r.url)}
            className="py-3 border-b border-gray-100"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-gray-900">{r.name}</Text>
                {r.description ? (
                  <Text
                    className="text-sm text-gray-600 mt-1"
                    numberOfLines={2}
                  >
                    {r.description}
                  </Text>
                ) : null}
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#9ca3af"
              />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Footer */}
      <View className="items-center mt-4">
        <Text className="text-xs text-gray-500">
          Built with ❤️ using React Native
        </Text>
        <Text className="text-xs text-gray-400 mt-2">Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
