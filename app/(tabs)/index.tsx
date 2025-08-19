// app/(tabs)/index.tsx
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import HabitCard from "../components/HabitCard";
import "../global.css";
import * as appwrite from "../lib/appwrite"; // robust import (works if your module exports `databases` or `database`)
import { client } from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import { Habit } from "../types/database.types";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, user, loadingUser } = useAuth();

  // Resolve DB client + constants from your lib (support both naming patterns)
  const dbClient: any =
    (appwrite as any).databases ?? (appwrite as any).database ?? null;
  const DATABASE_ID: string =
    (appwrite as any).DATABASE_ID ?? (appwrite as any).DB_ID ?? "";
  const HABITS_COLLECTION_ID: string =
    (appwrite as any).HABITS_COLLECTION_ID ??
    (appwrite as any).HABITS_COLLECTION ??
    (appwrite as any).HABIT_COLLECTION_ID ??
    "";

  // Optional Query helper (if your wrapper exports it)
  const Query = (appwrite as any).Query ?? null;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      if (!dbClient || typeof dbClient.listDocuments !== "function") {
        throw new Error(
          "Appwrite database client not found. Check ../lib/appwrite exports."
        );
      }

      // Try server-side filter first if Query helper exists
      let res: any;
      if (Query && typeof Query.equal === "function") {
        res = await dbClient.listDocuments(DATABASE_ID, HABITS_COLLECTION_ID, [
          Query.equal("user_id", (user as any)?.$id ?? (user as any)?.id),
        ]);
      } else {
        // fallback: fetch all and filter client-side (ok for small datasets)
        res = await dbClient.listDocuments(DATABASE_ID, HABITS_COLLECTION_ID);
        if (res?.documents) {
          res.documents = (res.documents as any[]).filter(
            (d) => d.user_id === ((user as any)?.$id ?? (user as any)?.id ?? "")
          );
        }
      }

      setHabits(res?.documents ?? []);
    } catch (err: any) {
      console.error("fetchHabits error:", err);
      setError(err?.message ?? "Failed to fetch habits");
    } finally {
      setLoading(false);
    }
  }, [user, dbClient, DATABASE_ID, HABITS_COLLECTION_ID, Query]);

  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace("/Auth");
      return;
    }
    const channel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${appwrite.COMPLETIONS_COLLECTION_ID}.documents`;
    const completionsSubscription = client.subscribe(
      completionsChannel,
      (response: appwrite.RealtimeResponse) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          fetchHabits();
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          fetchHabits();
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
          )
        ) {
          fetchHabits();
        }
      }
    );
    const habitsSubscription = client.subscribe(
      channel,
      (response: appwrite.RealtimeResponse) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          fetchHabits();
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          fetchHabits();
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
          )
        ) {
          fetchHabits();
        }
      }
    );
    if (user) fetchHabits();
    return () => {
      habitsSubscription();
      completionsSubscription();
    };
  }, [user, loadingUser, fetchHabits]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHabits();
    setRefreshing(false);
  };

  // sort newest first (non-destructive)
  const sortedHabits = useMemo(
    () =>
      [...habits].sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta;
      }),
    [habits]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Habit; index: number }) => (
      <HabitCard habit={item} index={index} onPress={() => {}} />
    ),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <View className="px-4 pt-4 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-2xl font-extrabold">
            Your Habits
          </Text>
          <Text className="text-[#666666] text-xs mt-1">
            Small wins, daily consistency.
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <Button
            mode="text"
            icon="plus"
            onPress={() => router.push("/add-habit")}
            compact
          >
            Add
          </Button>

          <Button mode="text" onPress={() => signOut()} icon="logout" compact>
            Logout
          </Button>
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff7a59" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 mb-4">{error}</Text>
          <Button mode="contained" onPress={fetchHabits}>
            Retry
          </Button>
        </View>
      ) : sortedHabits.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-slate-700 text-center mb-3">
            No habits yet —
          </Text>
          <Text className="text-slate-700 text-center mb-3">
            create one and start your streak🔥
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.push("/add-habit")}
            icon="plus"
          >
            Create first habit
          </Button>
        </View>
      ) : (
        <FlatList
          data={sortedHabits}
          keyExtractor={(item, idx) => item.$id ?? item.$id ?? String(idx)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}
