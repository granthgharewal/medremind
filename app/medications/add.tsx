import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import React, {useState} from 'react';
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
import {addMedication} from '@/utils/storage';
import {
  scheduleMedicationReminder,
  scheduleRefillReminder,
} from '@/utils/notification';

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
const {width} = Dimensions.get('window');
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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateTimePicker, setshowDateTimePicker] = useState({
    id: '',
    visible: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFrequencySelect = (freq: string) => {
    setSelectedFrequency(freq);
    const freqData = FREQUENCIES.find((f) => f.label === freq);
    setForm((prev) => ({
      ...prev,
      frequency: freq,
      times: freqData?.times ?? [],
    }));
  };

  const renderFrequencyOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.optionCard,
              selectedFrequency === freq.id && styles.selectedOptionCard,
            ]}
            onPress={() => handleFrequencySelect(freq.label)}
          >
            <View
              style={[
                styles.optionIcon,
                selectedFrequency === freq.label && styles.selectedOptionIcon,
              ]}
            >
              <Ionicons
                name={freq.icon}
                size={24}
                color={selectedFrequency === freq.label ? '#1a8e2d' : '#white'}
              />
            </View>
            <Text
              style={[
                styles.optionLabel,
                selectedFrequency === freq.label &&
                  styles.selectedFrequencyLabel,
              ]}
            >
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDurationOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {DURATIONS.map((duration) => (
          <TouchableOpacity
            key={duration.id}
            style={[
              styles.optionCard,
              selectedDuration === duration.label && styles.selectedOptionCard,
            ]}
            onPress={() => {
              setSelectedDuration(duration.label);
              setForm((prev) => ({...prev, duration: duration.label}));
            }}
          >
            <View
              style={[
                styles.optionIcon,
                selectedDuration === duration.label &&
                  styles.selectedOptionIcon,
              ]}
            >
              <Text
                style={[
                  styles.durationNumber,
                  selectedDuration === duration.label &&
                    styles.selectedDurationNumber,
                ]}
              >
                {duration.value > 0 ? duration.value : '∞'}
              </Text>
            </View>
            <Text
              style={[
                styles.optionLabel,
                selectedDuration === duration.label &&
                  styles.selectedOptionLabel,
              ]}
            >
              {duration.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!form.name.trim()) {
      newErrors.name = 'Medication name is required';
    }

    if (!form.dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    }

    if (!form.frequency) {
      newErrors.frequency = 'Frequency is required';
    }

    if (!form.duration) {
      newErrors.duration = 'Duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        Alert.alert('Error', 'Please fill in all required fields correctly');
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      // Generate a random color
      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const medicationData = {
        id: Math.random().toString(36).substring(2, 9),
        ...form,
        currentSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        totalSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        refillAt: form.refillAt ? Number(form.refillAt) : 0,
        startDate: form.startDate.toISOString(),
        color: randomColor,
      };

      await addMedication(medicationData);

      // Schedule reminders if enabled
      if (medicationData.reminderEnabled) {
        await scheduleMedicationReminder(medicationData);
      }
      if (medicationData.refillReminder) {
        await scheduleRefillReminder(medicationData);
      }

      Alert.alert(
        'Success',
        'Medication added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
        {cancelable: false}
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'Error',
        'Failed to save medication. Please try again.',
        [{text: 'OK'}],
        {cancelable: false}
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a8e2d', '#146922']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.headerGradient}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name='chevron-back'
              size={28}
              color='#1a8e2d'
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Medicaiton</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{flex: 1}}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.name && styles.inputError]}
                placeholder='Medication Name'
                placeholderTextColor={'#999'}
                value={form.name}
                onChangeText={(text) => {
                  setForm({...form, name: text});
                  if (errors.name) {
                    setErrors({...errors, name: ''});
                  }
                }}
              />
              {!!errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.dosage && styles.inputError]}
                placeholder='Dosage (e.g., 100mg)'
                placeholderTextColor={'#999'}
                onChangeText={(text) => {
                  setForm({...form, dosage: text});
                  if (errors.dosage) {
                    setErrors({...errors, dosage: ''});
                  }
                }}
              />
              {!!errors.dosage && (
                <Text style={styles.errorText}>{errors.dosage}</Text>
              )}
            </View>
            {/* Schedule */}
            <View style={styles.container}>
              <Text style={styles.sectionTitle}>How often?</Text>
              {!!errors.frequency && (
                <Text style={styles.errorText}>{errors.frequency}</Text>
              )}
              {/* Render frequency options */}
              {renderFrequencyOptions()}
              <Text style={styles.sectionTitle}>For how long?</Text>
              {/* render duration options */}
              {!!errors.duration && (
                <Text style={styles.errorText}>{errors.duration}</Text>
              )}
              {renderDurationOptions()}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateIconContainer}>
                  <Ionicons
                    name='calendar'
                    size={20}
                    color={'#1a8e2d'}
                  />
                </View>
                <Text style={styles.dateButtonText}>
                  Starts:{form.startDate.toLocaleDateString()}
                </Text>
                <Ionicons
                  name={'chevron-forward'}
                  size={20}
                  color={'#666'}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.startDate}
                  mode='date'
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setForm({...form, startDate: date});
                  }}
                />
              )}
              {/* Medication Times */}
              {!!form.frequency && form.frequency !== 'As needed' && (
                <View style={styles.timesContainer}>
                  <Text style={styles.timesTitle}>Medication Times</Text>
                  {form.times.map((time, index) => (
                    <TouchableOpacity
                      key={`${index}-${time}`}
                      style={styles.timeButton}
                      onPress={() => {
                        setshowDateTimePicker({
                          id: index.toString(),
                          visible: true,
                        });
                      }}
                    >
                      <View style={styles.timeIconContainer}>
                        <Ionicons
                          name='time'
                          size={20}
                          color={'#1a8e2d'}
                        />
                      </View>
                      <Text style={styles.timeButtonText}>{time}</Text>
                      <Ionicons
                        name='chevron-forward'
                        size={20}
                        color={'#666'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {showDateTimePicker?.id !== '' && (
                <DateTimePicker
                  value={(() => {
                    const [hours, minutes] = form.times[
                      Number(showDateTimePicker.id) || 0
                    ]
                      .split(':')
                      .map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                  })()}
                  mode='time'
                  onChange={(_, date) => {
                    setshowDateTimePicker({id: '', visible: false});
                    if (date) {
                      const newTimes = date?.toLocaleTimeString('default', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      setForm((prev) => ({
                        ...prev,
                        times: prev.times.map((t, index) =>
                          index === Number(showDateTimePicker.id) ? newTimes : t
                        ),
                      }));
                    }
                  }}
                />
              )}
            </View>
          </View>
          {/* Reminders */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name='notifications'
                      size={20}
                      color='#1a8e2d'
                    />
                  </View>
                  <View>
                    <Text style={styles.switchLabel}>Reminders</Text>
                    <Text style={styles.switchSubLabel}>
                      Get notified when it's time to take your medications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={form.reminderEnabled}
                  onValueChange={(value) => {
                    setForm({...form, reminderEnabled: value});
                  }}
                  trackColor={{false: '#ddd', true: '#1a8e2d'}}
                  thumbColor={'white'}
                  style={{transform: [{scaleX: 1.1}, {scaleY: 1.1}]}}
                />
              </View>
            </View>
          </View>
          {/* Refill Tracking */}
          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder='Add notes or special instructions'
                placeholderTextColor={'#999'}
                value={form.notes}
                onChangeText={(text) => {
                  setForm({...form, notes: text});
                }}
                multiline
                textAlignVertical='top'
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
            onPress={() => handleSave()}
          >
            <LinearGradient
              style={styles.saveButtonGradient}
              colors={['#1a8e2d', '#146922']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                {isSubmitting ? 'Adding...' : 'Add Medication'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AddMedicationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 150 : 130,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginLeft: 15,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
    marginTop: 10,
  },
  mainInput: {
    fontSize: 20,
    color: '#333',
    padding: 15,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOptionCard: {
    backgroundColor: '#1a8e2d',
    borderColor: '#1a8e2d',
  },
  optionIcon: {
    width: 55,
    height: 55,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedOptionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  selectedFrequencyLabel: {
    color: '#1a8e2d',
  },
  selectedOptionLabel: {
    color: 'white',
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a8e2d',
    marginBottom: 5,
  },
  selectedDurationNumber: {
    color: 'white',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchSubLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textAreaContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    height: 100,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveButtonGradient: {
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  refillInputs: {
    marginTop: 15,
  },
  timesContainer: {
    marginTop: 20,
  },
  timesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
