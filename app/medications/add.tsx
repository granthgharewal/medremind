import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import {useRouter} from 'expo-router';

const FREQUENCIES = [
  {
    id: '1',
    label: 'Once daily',
    icon: 'sunny-outline' as const,
    times: ['09:00'],
  },
  {
    id: '2',
    label: 'Twice daily',
    icon: 'sync-outline' as const,
    times: ['09:00', '21:00'],
  },
  {
    id: '3',
    label: 'Three times daily',
    icon: 'time-outline' as const,
    times: ['09:00', '15:00', '21:00'],
  },
  {
    id: '4',
    label: 'Four times daily',
    icon: 'repeat-outline' as const,
    times: ['09:00', '13:00', '17:00', '21:00'],
  },
  {id: '5', label: 'As needed', icon: 'calendar-outline' as const, times: []},
];

const DURATIONS = [
  {id: '1', label: '7 days', value: 7},
  {id: '2', label: '14 days', value: 14},
  {id: '3', label: '30 days', value: 30},
  {id: '4', label: '90 days', value: 90},
  {id: '5', label: 'Ongoing', value: -1},
];

const AddMedicationScreen = () => {
  const [form, setForm] = React.useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    startDate: new Date(),
    times: ['09:00'],
    notes: '',
    reminderEnabled: true,
    refillReminder: false,
    currentSupply: '',
    refillAt: '',
  });
  const router = useRouter();
  const renderFrequencyOptions = () => {
    return (
      <View>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 5,
            }}
            onPress={() => {
              // Handle frequency selection
              Alert.alert(`Selected: ${freq.label}`);
            }}
          >
            <Ionicons
              name={freq.icon}
              size={24}
              color='#1a8e2d'
            />
            <Text style={{marginLeft: 10}}>{freq.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDurationOptions = () => {
    return (
      <View>
        {DURATIONS.map((duration) => (
          <TouchableOpacity
            key={duration.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 5,
            }}
            onPress={() => {
              // Handle duration selection
              Alert.alert(`Selected duration: ${duration.label}`);
            }}
          >
            <Text style={{marginLeft: 10}}>
              {duration.value > 0 ? duration.value : '♾️'}
            </Text>
            <Text> {duration.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  return (
    <View>
      <LinearGradient
        colors={['#1a8e2d', '#146922']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />
      <View>
        <View>
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name='chevron-back'
              size={28}
              color='#1a8e2d'
            />
          </TouchableOpacity>
          <Text> New Medicaiton</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View>
            <View>
              <TextInput
                placeholder='Medication Name'
                placeholderTextColor={'#999'}
              />
            </View>
            <View>
              <TextInput
                placeholder='Dosage (e.g., 100mg)'
                placeholderTextColor={'#999'}
              />
            </View>
            <View>
              <Text>How often?</Text>
              {/* Render frequency options */}
              {renderFrequencyOptions()}
              <Text>For how long?</Text>
              {/* render duration options */}
              {renderDurationOptions()}
              <TouchableOpacity>
                <View>
                  <Ionicons
                    name='calendar'
                    size={20}
                    color={'1a8e2d'}
                  />
                  <Text>Starts {}</Text>
                </View>
              </TouchableOpacity>
              <DateTimePicker
                value={form.startDate}
                mode='date'
              />
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = form.times[0].split(':').map(Number);
                  const date = new Date();
                  date.setHours(hours, minutes, 0, 0);
                  return date;
                })()}
                mode='time'
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default AddMedicationScreen;

const styles = StyleSheet.create({
  container: {},
});
