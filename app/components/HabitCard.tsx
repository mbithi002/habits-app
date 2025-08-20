// components/HabitCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  GestureResponderEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import {
  COMPLETIONS_COLLECTION_ID,
  database,
  DATABASE_ID,
  HABITS_COLLECTION_ID,
} from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import { formatAbsoluteDate, formatDate } from "../lib/dateUtils";
import { Habit } from "../types/database.types";

type Props = {
  habit: Habit;
  index?: number;
  onPress?: (e: GestureResponderEvent) => void;
};

const STAGGER_DELAY = 40;

function HabitCardInner({ habit, index = 0, onPress }: Props) {
  const { user } = useAuth();
  const anim = useRef(new Animated.Value(0)).current;
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      delay: index * STAGGER_DELAY,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const opacity = anim;

  const createdAt = habit.created_at
    ? formatAbsoluteDate(new Date(habit.created_at))
    : "";

  const handleDeleteHabit = async (id: string) => {
    try {
      await database.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to delete habit");
    }
  };

  const handleCOmplete = async (id: string) => {
    if (!user) return;

    try {
      const now = new Date();

      const todayStartUTC = startOfTodayUTC();
      const alreadyToday = await database.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("habit_id", id),
          Query.equal("user_id", user.$id),
          Query.greaterThan("$createdAt", todayStartUTC),
        ]
      );

      if (alreadyToday.total > 0) {
        Alert.alert(
          "Already completed 🔥",
          "You've already completed this habit today."
        );
        return;
      }

      // 2) Decide streak update based on last_completed + frequency
      const decision = decideStreakUpdate({
        currentStreak: habit.streak_count ?? 0,
        lastCompletedISO: habit.last_completed ?? null,
        frequency: habit.frequency ?? "daily",
        now,
      });

      if (!decision.canComplete) {
        // Redundant double-check — should be covered by server guard above
        Alert.alert(
          "Already completed 🔥",
          "You've already completed this habit today. decision"
        );
        return;
      }

      const timeNowISO = now.toISOString();

      // 3) Create completion record first
      await database.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        { habit_id: id, user_id: user.$id }
        // Optionally also store a "completed_at": timeNowISO if you want local-day analytics
      );

      // 4) Update the habit document atomically with new streak + last_completed
      await database.updateDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        habit.$id,
        {
          streak_count: habit.streak_count + 1,
          last_completed: timeNowISO,
        }
      );

      // (Optional) Toast/Alert — keep minimal UI
      // Alert.alert("Done", decision.reset ? "Streak restarted 🔁" : "Streak +1 🔥");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to complete habit!");
    }
  };

  const renderLeftActions = () => (
    <View className="flex flex-1 items-start justify-center bg-red-400 px-4 rounded-xl mb-4">
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color={"#fff"}
      />
    </View>
  );
  const renderRightActions = () => (
    <View className="flex flex-1 items-end justify-center bg-green-400 px-4 rounded-xl mb-4">
      <MaterialCommunityIcons
        name="check-circle-outline"
        size={32}
        color={"#fff"}
      />
    </View>
  );
  return (
    <Swipeable
      ref={(ref) => {
        swipeableRefs.current[habit.$id] = ref;
      }}
      key={index}
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          handleDeleteHabit(habit.$id);
        } else if (direction === "right") {
          handleCOmplete(habit.$id);
        }
        swipeableRefs.current[habit.$id]?.close();
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
        }}
        className="mb-4"
      >
        <Pressable
          onPress={onPress}
          className="bg-white shadow-sm rounded-xl p-4 flex-row items-start border border-gray-100"
          android_ripple={{ color: "#f3f4f6" }}
        >
          {/* Left indicator */}
          <View className="w-12 h-12 rounded-lg bg-orange-100 items-center justify-center mr-4">
            <Feather name="repeat" size={22} color="#f97316" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text className="text-gray-800 text-lg font-semibold flex-1">
                {habit.title}
              </Text>

              <View className="ml-3 items-end">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-bold text-lg">
                    {habit.streak_count}
                  </Text>
                  <MaterialCommunityIcons
                    name="fire"
                    size={18}
                    color={habit.streak_count === 0 ? "#cbd5e0" : "#f97316"}
                    style={{ marginLeft: 2 }}
                  />
                </View>
                <Text className="text-gray-400 text-xs">Current streak</Text>
              </View>
            </View>

            <Text className="text-gray-600 text-sm mt-1 line-clamp-2">
              {habit.description}
            </Text>

            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center space-x-2">
                <View className="bg-gray-100 px-2 py-1 rounded-md">
                  <Text className="text-gray-700 text-xs font-medium">
                    {habit.frequency ?? "once"}
                  </Text>
                </View>
                <View className="bg-orange-100 px-2 py-1 rounded-md">
                  <Text className="text-orange-800 text-xs font-medium">
                    {formatDate(new Date(habit.last_completed))}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-400 text-xs">{createdAt}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
}

export default React.memo(HabitCardInner, (prev, next) => {
  return (
    (prev.habit.$id ?? prev.habit.$id) === (next.habit.$id ?? next.habit.$id) &&
    prev.habit.streak_count === next.habit.streak_count &&
    prev.habit.last_completed === next.habit.last_completed
  );
});

function normalizedFrequency(freq?: string) {
  const f = (freq || "daily").toLowerCase();
  if (f.includes("day")) return "daily";
  if (f.includes("week")) return "weekly"; // if you want weekly support later
  return "daily";
}

// Strip time part (local day)
function stripTimeLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function diffInLocalDays(from: Date, to: Date) {
  const a = stripTimeLocal(from).getTime();
  const b = stripTimeLocal(to).getTime();
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / MS);
}

// For server-side filtering by "today" using $createdAt (UTC-based).
// Creates 00:00:00.000 **UTC** boundary for today.
function startOfTodayUTC() {
  const now = new Date();
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  return d.toISOString();
}

type StreakDecision =
  | {
      canComplete: false;
      reason: "already-completed-today";
      nextStreak: number;
    }
  | { canComplete: true; nextStreak: number; reset: boolean };

function decideStreakUpdate(opts: {
  currentStreak: number;
  lastCompletedISO?: string | null;
  frequency?: string;
  now?: Date;
}): StreakDecision {
  const { currentStreak, lastCompletedISO, frequency } = opts;
  const now = opts.now ?? new Date();
  const today = stripTimeLocal(now);
  const freq = normalizedFrequency(frequency);

  // 🔹 NEW: if streak is 0, ignore last_completed completely
  if (currentStreak === 0) {
    return { canComplete: true, nextStreak: 1, reset: false };
  }

  if (!lastCompletedISO) {
    return { canComplete: true, nextStreak: 1, reset: false };
  }

  const last = new Date(lastCompletedISO);
  const lastLocal = stripTimeLocal(last);

  if (isSameLocalDay(lastLocal, today)) {
    return {
      canComplete: false,
      reason: "already-completed-today",
      nextStreak: currentStreak,
    };
  }

  if (freq === "daily") {
    const gap = diffInLocalDays(lastLocal, today);
    if (gap === 1) {
      return { canComplete: true, nextStreak: currentStreak + 1, reset: false };
    } else {
      return { canComplete: true, nextStreak: 1, reset: true };
    }
  }

  const gap = diffInLocalDays(lastLocal, today);
  if (gap === 1) {
    return { canComplete: true, nextStreak: currentStreak + 1, reset: false };
  }
  return { canComplete: true, nextStreak: 1, reset: true };
}
