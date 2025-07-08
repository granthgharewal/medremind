import AsyncStorage from '@react-native-async-storage/async-storage';

const MEDICATIONS_KEY = '@medications';
const DOSAGE_HISTORY_KEY = '@dosage_history';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  startDate: string;
  duration: string;
  color: string;
  reminderEnabled: boolean;
  currentSupply: number;
  totalSupply: number;
  refillAt: number;
  refillReminder: boolean;
  lastRefillDate?: string;
}

export interface DosageHistory {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
}

export async function addMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    medications.push(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
    if (data) {
      return JSON.parse(data) as Medication[];
    }
    return [];
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
}

export async function getDosageHistory(): Promise<DosageHistory[]> {
  try {
    const data = await AsyncStorage.getItem(DOSAGE_HISTORY_KEY);
    return data ? (JSON.parse(data) as DosageHistory[]) : [];
  } catch (error) {
    console.error('Error getting dosage history:', error);
    return [];
  }
}

export async function updateDosageHistory(
  dosage: DosageHistory
): Promise<void> {
  try {
    const dosageHistory = await getDosageHistory();
    dosageHistory.unshift(dosage);
    await AsyncStorage.setItem(
      DOSAGE_HISTORY_KEY,
      JSON.stringify(dosageHistory)
    );
  } catch (error) {
    console.error('Error updating dosage history:', error);
    throw error;
  }
}

export async function getTodaysMedication(): Promise<Medication[]> {
  try {
    const medications = await getMedications();
    const today = new Date().toISOString().split('T')[0];
    return medications.filter((med) => med.startDate.split('T')[0] === today);
  } catch (error) {
    console.error("Error getting today's medications:", error);
    return [];
  }
}
