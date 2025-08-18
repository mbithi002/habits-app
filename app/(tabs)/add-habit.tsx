import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { database, DATABASE_ID, HABITS_COLLECTION_ID } from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";

type FrequencyOption = "daily" | "weekly" | "monthly" | "custom";

export default function AddHabitScreen() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<FrequencyOption>("daily");
  const [customEvery, setCustomEvery] = useState<string>("1");
  const [customUnit, setCustomUnit] = useState<"days" | "weeks" | "months">(
    "days"
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setFrequency("daily");
    setCustomEvery("1");
    setCustomUnit("days");
  };

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace("/Auth");
    }
  }, [user, loadingUser]);

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFrequencyString = () => {
    if (frequency === "custom") {
      const every = parseInt(customEvery, 10) || 1;
      return `every ${every} ${customUnit}`;
    }
    return frequency;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!user) {
      Alert.alert("Not signed in", "Please sign in before creating habits.");
      return;
    }

    setLoading(true);

    const payload: Record<string, any> = {
      user_id: (user as any)?.$id ?? (user as any)?.id ?? "",
      title: title.trim(),
      description: description.trim(),
      streak_count: 0,
      task_completed: "false",
      frequency: buildFrequencyString(),
      created_at: new Date().toISOString(),
    };

    try {
      await database.createDocument(
        DATABASE_ID!,
        HABITS_COLLECTION_ID!,
        ID.unique(),
        payload
      );

      Alert.alert("Success", "Habit created successfully.");
      router.replace("/");
    } catch (err: any) {
      console.error("create habit error:", err);
      Alert.alert(
        "Error",
        err?.message ?? "An error occurred while creating habit."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-5 pb-12 bg-[#f5f5f5] min-h-full">
        <Text className="text-2xl font-bold mb-4">Create New Habit</Text>

        <View className="mb-4">
          <Text className="font-semibold mb-2">Title</Text>
          <TextInput
            placeholder="e.g. Read for 30 minutes"
            value={title}
            onChangeText={(t) => setTitle(t)}
            className={`border border-slate-200 rounded-lg p-3 bg-white ${errors.title ? "border-red-400" : ""}`}
            returnKeyType="next"
          />
          {errors.title ? (
            <Text className="text-red-400 mt-2">{errors.title}</Text>
          ) : null}
        </View>

        <View className="mb-4">
          <Text className="font-semibold mb-2">Description</Text>
          <TextInput
            placeholder="Why you want to build this habit..."
            value={description}
            onChangeText={(t) => setDescription(t)}
            className={`border border-slate-200 rounded-lg p-3 bg-white min-h-[100px] ${errors.description ? "border-red-400" : ""}`}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description ? (
            <Text className="text-red-400 mt-2">{errors.description}</Text>
          ) : null}
        </View>

        <View className="mb-4">
          <Text className="font-semibold mb-2">Frequency</Text>
          <View className="flex-row justify-between gap-2">
            <FrequencyButton
              label="Daily"
              active={frequency === "daily"}
              onPress={() => setFrequency("daily")}
            />
            <FrequencyButton
              label="Weekly"
              active={frequency === "weekly"}
              onPress={() => setFrequency("weekly")}
            />
            <FrequencyButton
              label="Monthly"
              active={frequency === "monthly"}
              onPress={() => setFrequency("monthly")}
            />
            <FrequencyButton
              label="Custom"
              active={frequency === "custom"}
              onPress={() => setFrequency("custom")}
            />
          </View>

          {frequency === "custom" && (
            <View className="mt-3 flex-row items-center gap-3">
              <TextInput
                keyboardType="number-pad"
                value={customEvery}
                onChangeText={setCustomEvery}
                className="border border-slate-200 rounded-lg p-3 bg-white flex-1"
                placeholder="Every (number)"
              />
              <View className="flex-row gap-2">
                <Pressable
                  className={`py-2 px-3 rounded-lg border ${customUnit === "days" ? "bg-orange-400 border-orange-400" : "border-slate-200 bg-white"}`}
                  onPress={() => setCustomUnit("days")}
                >
                  <Text
                    className={`font-semibold ${customUnit === "days" ? "text-white" : "text-gray-900"}`}
                  >
                    days
                  </Text>
                </Pressable>
                <Pressable
                  className={`py-2 px-3 rounded-lg border ${customUnit === "weeks" ? "bg-orange-400 border-orange-400" : "border-slate-200 bg-white"}`}
                  onPress={() => setCustomUnit("weeks")}
                >
                  <Text
                    className={`font-semibold ${customUnit === "weeks" ? "text-white" : "text-gray-900"}`}
                  >
                    weeks
                  </Text>
                </Pressable>
                <Pressable
                  className={`py-2 px-3 rounded-lg border ${customUnit === "months" ? "bg-orange-400 border-orange-400" : "border-slate-200 bg-white"}`}
                  onPress={() => setCustomUnit("months")}
                >
                  <Text
                    className={`font-semibold ${customUnit === "months" ? "text-white" : "text-gray-900"}`}
                  >
                    months
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View className="mt-6 flex-row justify-between gap-3">
          <Pressable
            className={`flex-1 py-4 rounded-xl bg-blue-400 items-center ${loading ? "opacity-70" : ""}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-white font-bold">Create Habit</Text>
            )}
          </Pressable>

          <Pressable
            className="flex-1 py-4 rounded-xl bg-red-400 border border-slate-200 items-center"
            onPress={() => {
              router.back();
              reset();
            }}
            disabled={loading}
          >
            <Text className="text-white font-bold">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FrequencyButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 mr-2 rounded-lg border items-center ${active ? "bg-orange-400 border-orange-400" : "border-slate-200 bg-white"}`}
    >
      <Text
        className={`font-semibold ${active ? "text-white" : "text-gray-900"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
