import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import {
  COMPLETIONS_COLLECTION_ID,
  database,
  DATABASE_ID,
  HABITS_COLLECTION_ID,
} from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import { formatDate } from "../lib/dateUtils";
import { Habit, HabitCompletions } from "../types/database.types";

/** ───────────────────────────────
 * Date utilities (local-day granularity)
 * ─────────────────────────────── */
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
function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** ───────────────────────────────
 * Types
 * ─────────────────────────────── */
type CompletionDoc = HabitCompletions & {
  $createdAt: string;
};

/** ───────────────────────────────
 * Streaks Screen
 * ─────────────────────────────── */
const RANGES = [7, 30, 90] as const;

const StreaksScreen = () => {
  const { user, loadingUser } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<CompletionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch habits for this user
      const habitsRes = await database.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", (user as any)?.$id ?? (user as any)?.id ?? "")]
      );

      // Fetch recent completions (cap at 500 for perf; expand if you need)
      const completionsRes = await database.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", (user as any)?.$id ?? (user as any)?.id ?? ""),
          Query.orderDesc("$createdAt"),
          Query.limit(500),
        ]
      );

      setHabits(habitsRes.documents as unknown as Habit[]);
      setCompletions(completionsRes.documents as unknown as CompletionDoc[]);
    } catch (err: any) {
      console.error("Streaks fetch error:", err);
      Alert.alert(
        "Error",
        err?.message ?? "Failed to load streaks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loadingUser && user) {
      fetchData();
    }
  }, [user, loadingUser, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  /** ───────────────────────────────
   * Derived data
   * ─────────────────────────────── */
  const today = stripTimeLocal(new Date());
  const startDate = addDays(today, -(range - 1));

  // completions grouped by habit -> set of local-day keys
  const completionsByHabitDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of completions) {
      const key = dateKey(stripTimeLocal(new Date(c.$createdAt)));
      const set = map.get(c.habit_id) ?? new Set<string>();
      set.add(key);
      map.set(c.habit_id, set);
    }
    return map;
  }, [completions]);

  // global total completions within range
  const totalCompletionsInRange = useMemo(() => {
    let count = 0;
    for (const c of completions) {
      const d = stripTimeLocal(new Date(c.$createdAt));
      if (d >= startDate && d <= today) count += 1;
    }
    return count;
  }, [completions, startDate, today]);

  const activeStreaks = useMemo(
    () => habits.filter((h) => (h.streak_count ?? 0) > 0).length,
    [habits]
  );

  const longestStreak = useMemo(
    () => habits.reduce((m, h) => Math.max(m, h.streak_count ?? 0), 0),
    [habits]
  );

  const dateKeysLast7 = useMemo(() => {
    // Used for the compact “week row” preview per habit (always 7 days)
    const k: string[] = [];
    const start = addDays(today, -6);
    for (let i = 0; i < 7; i++) {
      k.push(dateKey(addDays(start, i)));
    }
    return k;
  }, [today]);

  /** ───────────────────────────────
   * Render helpers
   * ─────────────────────────────── */
  const RangeChip = ({
    n,
    active,
    onPress,
  }: {
    n: number;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={`px-3 py-2 rounded-xl border ${
        active ? "bg-orange-400 border-orange-400" : "bg-white border-slate-200"
      }`}
    >
      <Text
        className={`font-semibold ${active ? "text-white" : "text-gray-900"}`}
      >
        {n}d
      </Text>
    </Pressable>
  );

  const WeekRow = ({ habitId }: { habitId: string }) => {
    const set = completionsByHabitDay.get(habitId) ?? new Set<string>();
    return (
      <View className="flex-row gap-1 mt-2">
        {dateKeysLast7.map((k) => {
          const done = set.has(k);
          return (
            <View
              key={k}
              className={`w-5 h-5 rounded-md border ${
                done
                  ? "bg-green-400 border-green-400"
                  : "bg-white border-slate-200"
              }`}
            />
          );
        })}
      </View>
    );
  };

  const HabitRow = ({ h }: { h: Habit }) => {
    const set = completionsByHabitDay.get(h.$id) ?? new Set<string>();

    // Completions for this habit within selected range
    let inRange = 0;
    for (let d = 0; d < range; d++) {
      const k = dateKey(addDays(startDate, d));
      if (set.has(k)) inRange += 1;
    }

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-gray-900 font-semibold text-base">
              {h.title}
            </Text>
            {h.description ? (
              <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                {h.description}
              </Text>
            ) : null}
            <WeekRow habitId={h.$id} />
          </View>

          <View className="items-end">
            <View className="flex-row items-center">
              <Text className="text-gray-900 font-bold text-lg">
                {h.streak_count ?? 0}
              </Text>
              <MaterialCommunityIcons
                name="fire"
                size={18}
                color={(h.streak_count ?? 0) === 0 ? "#cbd5e0" : "#f97316"}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text className="text-gray-400 text-xs">Current streak</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center gap-2">
            <View className="bg-gray-100 px-2 py-1 rounded-md">
              <Text className="text-gray-700 text-xs font-medium">
                {h.frequency ?? "daily"}
              </Text>
            </View>
            <View className="bg-orange-100 px-2 py-1 rounded-md">
              <Text className="text-orange-800 text-xs font-medium">
                {h.last_completed
                  ? formatDate(new Date(h.last_completed))
                  : "—"}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-gray-900 font-semibold">{inRange}</Text>
            <Text className="text-gray-400 text-xs">in last {range}d</Text>
          </View>
        </View>
      </View>
    );
  };

  /** ───────────────────────────────
   * Main render
   * ─────────────────────────────── */
  if (loadingUser || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f5f5]">
        <ActivityIndicator />
        <Text className="mt-3 text-gray-600">Loading streaks…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f5f5] px-6">
        <MaterialCommunityIcons
          name="account-alert-outline"
          size={36}
          color="#9ca3af"
        />
        <Text className="mt-3 text-gray-700 text-center">
          Please sign in to view your streaks.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-[#f5f5f5]"
      contentContainerClassName="p-5 pb-12 min-h-full"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Text className="text-3xl text-center font-bold">Streaks</Text>

      {/* Summary cards */}
      <View className="mt-5 grid grid-cols-1 gap-3">
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="fire" size={22} color="#f97316" />
              <Text className="ml-2 text-gray-900 font-semibold">
                Active streaks
              </Text>
            </View>
            <Text className="text-gray-900 font-bold text-lg">
              {activeStreaks}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="trending-up" size={20} color="#111827" />
              <Text className="ml-2 text-gray-900 font-semibold">
                Longest streak
              </Text>
            </View>
            <Text className="text-gray-900 font-bold text-lg">
              {longestStreak}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="check-all"
                size={22}
                color="#16a34a"
              />
              <Text className="ml-2 text-gray-900 font-semibold">
                Completions (last {range}d)
              </Text>
            </View>
            <Text className="text-gray-900 font-bold text-lg">
              {totalCompletionsInRange}
            </Text>
          </View>

          {/* Range selector */}
          <View className="mt-4 flex-row items-center justify-end gap-2">
            {RANGES.map((n) => (
              <RangeChip
                key={n}
                n={n}
                active={range === n}
                onPress={() => setRange(n)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Habits list */}
      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Your habits
        </Text>

        {habits.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 border border-gray-100 items-center">
            <MaterialCommunityIcons
              name="playlist-remove"
              size={28}
              color="#9ca3af"
            />
            <Text className="mt-2 text-gray-600 text-center">
              No habits yet. Create one to start building streaks!
            </Text>
          </View>
        ) : (
          habits.map((h) => <HabitRow key={h.$id} h={h} />)
        )}
      </View>
    </ScrollView>
  );
};

export default StreaksScreen;
