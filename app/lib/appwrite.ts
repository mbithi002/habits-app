import Constants from "expo-constants";
import { Account, Client, Databases } from 'react-native-appwrite';

const extra = Constants.expoConfig?.extra || {};


export const client = new Client()
    .setEndpoint(extra.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(extra.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setPlatform(extra.EXPO_PUBLIC_APPWRITE_PLATFORM);

export const account = new Account(client)
export const database = new Databases(client)

export const DATABASE_ID = extra.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
export const HABITS_COLLECTION_ID = extra.EXPO_PUBLIC_APPWRITE_HABITS_COLLECTION_ID;
export const COMPLETIONS_COLLECTION_ID = extra.EXPO_PUBLIC_APPWRITE_COMPLETIONS_COLLECTION_ID;

export interface RealtimeResponse {
    events: string[];
    payload: any;
}