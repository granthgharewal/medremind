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

export async function updateMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    const index = medications.findIndex((med) => med.id === medication.id);
    if (index !== -1) {
      medications[index] = medication;
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
    }
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const medications = await getMedications();
    const deleteIndex = medications.findIndex((med) => med.id === id);
    if (deleteIndex !== -1) {
      const updatedMedications = medications.filter((med) => med.id !== id);
      await AsyncStorage.setItem(
        MEDICATIONS_KEY,
        JSON.stringify(updatedMedications)
      );
    }
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
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

export async function getTodaysDoses(): Promise<DosageHistory[]> {
  try {
    const history = await getDosageHistory();
    const today = new Date().toDateString();
    return history.filter(
      (dose) => new Date(dose.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's doses:", error);
    return [];
  }
}

export async function updateDosageHistory(
  dosage: DosageHistory
): Promise<DosageHistory[]> {
  try {
    const dosageHistory = await getDosageHistory();
    const exisitngIndex = dosageHistory.findIndex(
      (dose) => dose.medicationId === dosage.medicationId
    );
    if (exisitngIndex !== -1) {
      dosageHistory[exisitngIndex] = dosage;
      await AsyncStorage.setItem(
        DOSAGE_HISTORY_KEY,
        JSON.stringify(dosageHistory)
      );
    } else {
      console.warn('Dosage history entry not found for update');
    }
    return dosageHistory;
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

export async function recordDose(
  medicationId: string,
  taken: boolean,
  timestamp: string
): Promise<void> {
  try {
    const history = await getDosageHistory();
    const dosageHistory: DosageHistory = {
      id: Math.random().toString(36).substring(2, 15),
      medicationId,
      timestamp: timestamp,
      taken,
    };
    history.push(dosageHistory);
    await AsyncStorage.setItem(DOSAGE_HISTORY_KEY, JSON.stringify(history));

    // Update medication supply if taken
    if (taken) {
      const medications = await getMedications();
      const medication = medications.find((med) => med.id === medicationId);
      if (medication && medication.currentSupply > 0) {
        medication.currentSupply -= 1;
        await updateMedication(medication);
      }
    }
  } catch (error) {
    console.error('Error recording dose:', error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([MEDICATIONS_KEY, DOSAGE_HISTORY_KEY]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}
